<?php
/**
 * Claude API proxy — keeps the Anthropic API key server-side.
 *
 * POST /swivo/v1/chat/turn
 *   body: {
 *     messages: [{ role: 'user'|'assistant', content: string }, ...],
 *     dossier:  partial dossier so far  // optional, helps the model focus
 *   }
 *
 * Returns: { reply: string, extract: object }
 *   - `reply`   : the assistant's next message (French, conversational).
 *   - `extract` : a small JSON blob with any new dossier fields the model
 *                 could infer from the latest exchange. The SPA merges this
 *                 into its local Dossier object.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SWIVO_CLAUDE_MODEL = 'claude-sonnet-4-6';
const SWIVO_CLAUDE_URL   = 'https://api.anthropic.com/v1/messages';

add_action( 'rest_api_init', function () {
	register_rest_route( 'swivo/v1', '/chat/turn', array(
		'methods'             => 'POST',
		'permission_callback' => 'swivo_chat_permission',
		'callback'            => 'swivo_chat_turn',
	) );
} );

/**
 * Gate: anonymous visitors may chat but only with a short per-IP daily budget.
 * Logged-in users get a generous per-user budget. Prevents cost burn via IP
 * rotation while keeping the public landing-page chat usable. To require auth
 * outright, set option `swivo_chat_require_auth` to 1.
 */
function swivo_chat_permission() {
	if ( is_user_logged_in() ) return true;
	if ( (int) get_option( 'swivo_chat_require_auth', 0 ) ) {
		return new WP_Error( 'swivo_auth_required', 'Connexion requise pour le chat.', array( 'status' => 401 ) );
	}
	return true;
}

function swivo_chat_turn( WP_REST_Request $req ) {
	$uid     = get_current_user_id();
	$ip      = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( $_SERVER['REMOTE_ADDR'] ) : 'unknown';

	// Per-minute burst limit (anti-abuse): 12 anon, 30 user.
	$burst_key   = 'swivo_chat_burst_' . ( $uid ?: md5( $ip ) );
	$burst_count = (int) get_transient( $burst_key );
	$burst_cap   = $uid ? 30 : 12;
	if ( $burst_count >= $burst_cap ) {
		return new WP_Error( 'swivo_throttled', 'Trop de tours en peu de temps. Réessayez dans une minute.', array( 'status' => 429 ) );
	}
	set_transient( $burst_key, $burst_count + 1, 60 );

	// Daily budget (cost cap): 40 anon / IP, 400 user. Adjustable via option.
	$day_key   = 'swivo_chat_day_' . date( 'Ymd' ) . '_' . ( $uid ?: md5( $ip ) );
	$day_count = (int) get_transient( $day_key );
	$day_cap   = $uid
		? (int) get_option( 'swivo_chat_daily_user_cap', 400 )
		: (int) get_option( 'swivo_chat_daily_anon_cap', 40 );
	if ( $day_count >= $day_cap ) {
		return new WP_Error( 'swivo_quota', 'Quota IA atteint pour aujourd’hui.', array( 'status' => 429 ) );
	}
	set_transient( $day_key, $day_count + 1, DAY_IN_SECONDS );

	$body     = $req->get_json_params();
	$messages = isset( $body['messages'] ) && is_array( $body['messages'] ) ? $body['messages'] : array();
	$dossier  = isset( $body['dossier'] ) && is_array( $body['dossier'] ) ? $body['dossier'] : array();

	if ( ! $messages ) {
		return new WP_Error( 'swivo_invalid', 'Aucun message.', array( 'status' => 400 ) );
	}

	// Defensive cap to avoid runaway costs.
	if ( count( $messages ) > 40 ) {
		$messages = array_slice( $messages, -40 );
	}
	foreach ( $messages as &$m ) {
		if ( ! isset( $m['role'], $m['content'] ) ) {
			return new WP_Error( 'swivo_invalid', 'Format message invalide.', array( 'status' => 400 ) );
		}
		$m['role']    = in_array( $m['role'], array( 'user', 'assistant' ), true ) ? $m['role'] : 'user';
		$m['content'] = (string) wp_strip_all_tags( $m['content'] );
		if ( strlen( $m['content'] ) > 4000 ) {
			$m['content'] = substr( $m['content'], 0, 4000 );
		}
	}
	unset( $m );

	$system = swivo_chat_system_prompt( $dossier );

	$text = swivo_ai_chat( $messages, array(
		'system'     => $system,
		'max_tokens' => 800,
	) );
	if ( is_wp_error( $text ) ) {
		return $text;
	}

	list( $reply, $extract ) = swivo_chat_split_extract( (string) $text );

	return rest_ensure_response( array(
		'reply'   => $reply,
		'extract' => $extract,
	) );
}

function swivo_chat_system_prompt( array $dossier ) {
	$known = wp_json_encode( $dossier, JSON_UNESCAPED_UNICODE );
	return <<<EOT
Tu es l'assistant Swivo, expert français en création d'entreprise (micro, EI, EURL, SARL, SASU, SAS, SA, SCI) et en formalités INPI / Guichet unique. Tu réponds en français, ton chaleureux et précis, phrases courtes.

Mission : recueillir progressivement les informations nécessaires à un dossier de création conforme au Guichet unique (forme juridique, dirigeant, siège social, activité principale, capital, associés).

Tu poses UNE question à la fois. Tu adaptes la question suivante à la réponse précédente. Tu n'inventes jamais une information manquante.

Quand tu as identifié de nouvelles données structurées, termine ta réponse par un bloc JSON unique délimité par ```json ... ``` contenant uniquement les champs nouveaux ou modifiés. Schéma :
{
  "projet": "service|commerce|artisanat|autre",
  "associes": "seul|plusieurs",
  "capitalLevee": "oui|non|peutetre",
  "ca": "lt30k|30_80|gt80",
  "forme": "micro|ei|eurl|sarl|sasu|sas|sa|sci",
  "identite": { "prenom": "...", "nom": "...", "email": "..." },
  "siege":    { "adresse": "..." },
  "activite": "...",
  "capital":  "..."
}
Si rien à extraire, ne mets pas de bloc JSON.

Données déjà connues sur ce dossier : {$known}.
EOT;
}

function swivo_chat_split_extract( $text ) {
	$extract = new stdClass();
	$reply   = $text;

	if ( preg_match( '/```json\s*(\{.*?\})\s*```/s', $text, $m ) ) {
		$parsed = json_decode( $m[1], true );
		if ( is_array( $parsed ) ) {
			$extract = $parsed;
		}
		$reply = trim( str_replace( $m[0], '', $text ) );
	}
	return array( $reply, $extract );
}
