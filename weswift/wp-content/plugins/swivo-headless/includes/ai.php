<?php
/**
 * AI provider abstraction.
 *
 * Uses the WordPress AI Client SDK when the official AI Provider plugins
 * (`ai-provider-for-anthropic`, `ai-provider-for-google`) are active, and
 * falls back to a direct Anthropic Messages API call otherwise. This keeps
 * /chat/turn working both in local dev (no provider plugin) and on prod
 * (provider plugins manage credentials in WP admin).
 *
 * Public entry point:
 *   swivo_ai_chat( array $messages, array $opts = [] ): string
 *     - messages: [ ['role'=>'user'|'assistant', 'content'=>string], ... ]
 *     - opts.system   : system prompt (string)
 *     - opts.provider : 'anthropic' (default) | 'google'
 *     - opts.max_tokens: int (default 800)
 *
 * Returns plain text or throws WP_Error on upstream failure.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Selected provider for the chat — anthropic by default, google as alternate.
 * Editable from Settings → Swivo or via filter `swivo_ai_default_provider`.
 */
function swivo_ai_default_provider() {
	$p = (string) get_option( 'swivo_ai_provider', 'anthropic' );
	return apply_filters( 'swivo_ai_default_provider', $p );
}

/**
 * True when the WordPress AI Client SDK is available (shipped by either AI
 * Provider plugin or installed via Composer).
 */
function swivo_ai_client_available() {
	return class_exists( '\\WordPress\\AiClient\\AiClient' );
}

/**
 * True when a specific provider plugin is active and can answer.
 */
function swivo_ai_provider_active( $provider ) {
	if ( ! swivo_ai_client_available() ) return false;
	// Provider plugins register themselves under their slug.
	// We can't introspect the registry cheaply, so trust the API key option
	// the plugin (or our settings) stores.
	switch ( $provider ) {
		case 'anthropic':
			return getenv( 'ANTHROPIC_API_KEY' )
				|| get_option( 'swivo_anthropic_key' )
				|| get_option( 'ai_provider_anthropic_api_key' );
		case 'google':
			return getenv( 'GOOGLE_API_KEY' )
				|| get_option( 'swivo_google_key' )
				|| get_option( 'ai_provider_google_api_key' );
	}
	return false;
}

/**
 * Main entry point. Returns the assistant's reply text.
 *
 * @return string|WP_Error
 */
function swivo_ai_chat( array $messages, array $opts = array() ) {
	$provider   = isset( $opts['provider'] ) ? (string) $opts['provider'] : swivo_ai_default_provider();
	$system     = isset( $opts['system'] ) ? (string) $opts['system'] : '';
	$max_tokens = isset( $opts['max_tokens'] ) ? (int) $opts['max_tokens'] : 800;

	// Allow any plugin (or test) to short-circuit the call.
	$override = apply_filters( 'swivo_ai_chat_response', null, $messages, $opts );
	if ( null !== $override ) {
		return is_string( $override ) ? $override : new WP_Error( 'swivo_ai_filter', 'Invalid filter response.', array( 'status' => 500 ) );
	}

	if ( swivo_ai_client_available() ) {
		return swivo_ai_chat_via_client( $provider, $messages, $system, $max_tokens );
	}

	// Fallback: direct API for providers we natively support.
	switch ( $provider ) {
		case 'anthropic':
			return swivo_ai_chat_direct_anthropic( $messages, $system, $max_tokens );
		case 'deepseek':
			return swivo_ai_chat_direct_deepseek( $messages, $system, $max_tokens );
		case 'groq':
			return swivo_ai_chat_direct_groq( $messages, $system, $max_tokens );
		case 'mistral':
			return swivo_ai_chat_direct_mistral( $messages, $system, $max_tokens );
		case 'openrouter':
			return swivo_ai_chat_direct_openrouter( $messages, $system, $max_tokens );
		default:
			return new WP_Error( 'swivo_ai_no_provider', 'Provider ' . $provider . ' indisponible.', array( 'status' => 503 ) );
	}
}

/**
 * Generic OpenAI-compatible chat call (DeepSeek, Groq, Mistral, OpenRouter all
 * expose the same /chat/completions shape — we share the implementation).
 */
function swivo_ai_chat_openai_compatible( $endpoint, $api_key, $model, $messages, $system, $max_tokens, $extra_headers = array() ) {
	if ( ! $api_key ) {
		return new WP_Error( 'swivo_no_key', 'Clé API non configurée pour ' . $endpoint, array( 'status' => 503 ) );
	}
	$payload = array(
		'model'      => $model,
		'max_tokens' => $max_tokens,
		'messages'   => array_values( array_filter( array_merge(
			$system ? array( array( 'role' => 'system', 'content' => $system ) ) : array(),
			$messages
		) ) ),
	);
	$response = wp_remote_post( $endpoint, array(
		'timeout' => 30,
		'headers' => array_merge( array(
			'Authorization' => 'Bearer ' . $api_key,
			'Content-Type'  => 'application/json',
		), $extra_headers ),
		'body' => wp_json_encode( $payload ),
	) );
	if ( is_wp_error( $response ) ) {
		return new WP_Error( 'swivo_upstream', $response->get_error_message(), array( 'status' => 502 ) );
	}
	$code = wp_remote_retrieve_response_code( $response );
	$raw  = wp_remote_retrieve_body( $response );
	if ( $code < 200 || $code >= 300 ) {
		return new WP_Error( 'swivo_upstream', 'Upstream ' . $code, array( 'status' => 502, 'detail' => $raw ) );
	}
	$decoded = json_decode( $raw, true );
	$text = (string) ( $decoded['choices'][0]['message']['content'] ?? '' );
	return $text;
}

/**
 * DeepSeek (gratuit / pay-as-you-go très bas). https://platform.deepseek.com
 *   - Clé : `swivo_deepseek_key` (option WP) ou env DEEPSEEK_API_KEY
 *   - Modèle : `swivo_deepseek_model` (défaut deepseek-chat)
 */
function swivo_ai_chat_direct_deepseek( $messages, $system, $max_tokens ) {
	$key   = trim( (string) ( getenv( 'DEEPSEEK_API_KEY' ) ?: get_option( 'swivo_deepseek_key', '' ) ) );
	$model = (string) get_option( 'swivo_deepseek_model', 'deepseek-chat' );
	return swivo_ai_chat_openai_compatible(
		'https://api.deepseek.com/v1/chat/completions',
		$key, $model, $messages, $system, $max_tokens
	);
}

/**
 * Groq — inférence gratuite très rapide. https://console.groq.com
 *   - Clé : `swivo_groq_key`
 *   - Modèle : `swivo_groq_model` (défaut llama-3.1-70b-versatile)
 */
function swivo_ai_chat_direct_groq( $messages, $system, $max_tokens ) {
	$key   = trim( (string) ( getenv( 'GROQ_API_KEY' ) ?: get_option( 'swivo_groq_key', '' ) ) );
	$model = (string) get_option( 'swivo_groq_model', 'llama-3.1-70b-versatile' );
	return swivo_ai_chat_openai_compatible(
		'https://api.groq.com/openai/v1/chat/completions',
		$key, $model, $messages, $system, $max_tokens
	);
}

/**
 * Mistral — tier La Plateforme avec crédits gratuits. https://console.mistral.ai
 */
function swivo_ai_chat_direct_mistral( $messages, $system, $max_tokens ) {
	$key   = trim( (string) ( getenv( 'MISTRAL_API_KEY' ) ?: get_option( 'swivo_mistral_key', '' ) ) );
	$model = (string) get_option( 'swivo_mistral_model', 'mistral-small-latest' );
	return swivo_ai_chat_openai_compatible(
		'https://api.mistral.ai/v1/chat/completions',
		$key, $model, $messages, $system, $max_tokens
	);
}

/**
 * OpenRouter — multi-provider aggregator avec modèles gratuits étiquetés `:free`.
 *   - Clé : `swivo_openrouter_key`
 *   - Modèle : `swivo_openrouter_model` (défaut deepseek/deepseek-chat:free)
 */
function swivo_ai_chat_direct_openrouter( $messages, $system, $max_tokens ) {
	$key   = trim( (string) ( getenv( 'OPENROUTER_API_KEY' ) ?: get_option( 'swivo_openrouter_key', '' ) ) );
	$model = (string) get_option( 'swivo_openrouter_model', 'deepseek/deepseek-chat:free' );
	return swivo_ai_chat_openai_compatible(
		'https://openrouter.ai/api/v1/chat/completions',
		$key, $model, $messages, $system, $max_tokens,
		array(
			'HTTP-Referer' => home_url( '/' ),
			'X-Title'      => 'Swivo',
		)
	);
}

/**
 * Use the WordPress AI Client SDK. Documented at:
 *   https://github.com/WordPress/wp-ai-client
 *
 * Pseudo-API:
 *   AiClient::prompt($lastUserText)
 *     ->usingProvider('anthropic')
 *     ->withSystemInstruction($system)
 *     ->withMaxTokens($n)
 *     ->generateTextResult()
 *     ->toText()
 *
 * Multi-turn history isn't first-class in the simple prompt() form — we
 * collapse the conversation into a single user turn that includes prior
 * exchanges, which matches how the SDK treats provider-agnostic chats.
 */
function swivo_ai_chat_via_client( $provider, $messages, $system, $max_tokens ) {
	try {
		$last_user = '';
		$history   = array();
		foreach ( $messages as $m ) {
			if ( $m['role'] === 'user' ) {
				$last_user = (string) $m['content'];
				$history[] = 'Utilisateur : ' . $m['content'];
			} else {
				$history[] = 'Assistant : ' . $m['content'];
			}
		}
		// Drop the trailing user echo to avoid duplication.
		array_pop( $history );
		$prefix = $history ? implode( "\n", $history ) . "\n\nUtilisateur : " : '';
		$prompt = $prefix . $last_user;

		$call = \WordPress\AiClient\AiClient::prompt( $prompt )
			->usingProvider( $provider );

		if ( $system && method_exists( $call, 'withSystemInstruction' ) ) {
			$call = $call->withSystemInstruction( $system );
		} elseif ( $system && method_exists( $call, 'withSystem' ) ) {
			$call = $call->withSystem( $system );
		}
		if ( $max_tokens && method_exists( $call, 'withMaxTokens' ) ) {
			$call = $call->withMaxTokens( $max_tokens );
		}

		$result = $call->generateTextResult();
		$text   = method_exists( $result, 'toText' ) ? $result->toText() : (string) $result;
		return (string) $text;
	} catch ( \Throwable $e ) {
		return new WP_Error( 'swivo_ai_client', $e->getMessage(), array( 'status' => 502 ) );
	}
}

/**
 * Direct Anthropic Messages API — used when the AI Client SDK isn't installed.
 * Mirrors the historical behaviour of includes/claude.php.
 */
function swivo_ai_chat_direct_anthropic( $messages, $system, $max_tokens ) {
	$key = trim( (string) get_option( 'swivo_anthropic_key', '' ) );
	if ( ! $key ) {
		return new WP_Error( 'swivo_no_key', 'Clé Anthropic non configurée et plugin AI Provider absent.', array( 'status' => 503 ) );
	}
	$model = (string) get_option( 'swivo_anthropic_model', 'claude-sonnet-4-6' );

	$response = wp_remote_post( 'https://api.anthropic.com/v1/messages', array(
		'timeout' => 30,
		'headers' => array(
			'x-api-key'         => $key,
			'anthropic-version' => '2023-06-01',
			'content-type'      => 'application/json',
		),
		'body' => wp_json_encode( array(
			'model'      => $model,
			'max_tokens' => $max_tokens,
			'system'     => $system,
			'messages'   => $messages,
		) ),
	) );

	if ( is_wp_error( $response ) ) {
		return new WP_Error( 'swivo_upstream', $response->get_error_message(), array( 'status' => 502 ) );
	}
	$code = wp_remote_retrieve_response_code( $response );
	$raw  = wp_remote_retrieve_body( $response );
	if ( $code < 200 || $code >= 300 ) {
		return new WP_Error( 'swivo_upstream', 'Anthropic ' . $code, array( 'status' => 502, 'detail' => $raw ) );
	}
	$decoded = json_decode( $raw, true );
	$text = '';
	if ( isset( $decoded['content'] ) && is_array( $decoded['content'] ) ) {
		foreach ( $decoded['content'] as $blk ) {
			if ( isset( $blk['type'], $blk['text'] ) && 'text' === $blk['type'] ) {
				$text .= $blk['text'];
			}
		}
	}
	return $text;
}
