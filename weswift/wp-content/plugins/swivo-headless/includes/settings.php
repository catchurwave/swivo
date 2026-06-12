<?php
/**
 * Settings → Swivo admin screen. Manages public pricing (so editors can
 * update headline prices without code) and the CORS allow-list.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function swivo_register_settings_page() {
	add_menu_page(
		'Swivo Headless',
		'Swivo',
		'manage_options',
		'swivo-headless',
		'swivo_render_settings_page',
		'dashicons-rocket',
		28
	);
}

function swivo_register_settings() {
	register_setting( 'swivo_settings', 'swivo_creation_price', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_gestion_price',  array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_allowed_origins', array( 'sanitize_callback' => 'swivo_sanitize_origins' ) );
	register_setting( 'swivo_settings', 'swivo_anthropic_key', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_stripe_secret', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_stripe_webhook_secret', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_stripe_creation_amount_cents', array( 'sanitize_callback' => 'absint' ) );
	register_setting( 'swivo_settings', 'swivo_stripe_gestion_amount_cents',  array( 'sanitize_callback' => 'absint' ) );
	register_setting( 'swivo_settings', 'swivo_stripe_gestion_price_id',      array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_inpi_base_url',                array( 'sanitize_callback' => 'esc_url_raw' ) );
	register_setting( 'swivo_settings', 'swivo_inpi_token',                   array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_spa_url',                      array( 'sanitize_callback' => 'esc_url_raw' ) );
	register_setting( 'swivo_settings', 'swivo_wc_creation_product_id',       array( 'sanitize_callback' => 'absint' ) );
	register_setting( 'swivo_settings', 'swivo_wc_gestion_product_id',        array( 'sanitize_callback' => 'absint' ) );
	register_setting( 'swivo_settings', 'swivo_deepseek_key',                 array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_deepseek_model',               array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_groq_key',                     array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_groq_model',                   array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_mistral_key',                  array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_mistral_model',                array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_openrouter_key',               array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_openrouter_model',             array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_turnstile_site',               array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'swivo_settings', 'swivo_turnstile_secret',             array( 'sanitize_callback' => 'sanitize_text_field' ) );
}

/**
 * Resolve the SPA's public URL, used for Stripe redirects and email links.
 * Falls back to the WP home URL if the option is unset.
 */
function swivo_spa_url( $path = '/' ) {
	$base = trim( (string) get_option( 'swivo_spa_url', '' ) );
	if ( ! $base ) {
		$base = home_url( '/' );
	}
	return rtrim( $base, '/' ) . '/' . ltrim( $path, '/' );
}

function swivo_sanitize_origins( $raw ) {
	$lines = array_filter( array_map( 'trim', explode( "\n", (string) $raw ) ) );
	$clean = array();
	foreach ( $lines as $line ) {
		if ( filter_var( $line, FILTER_VALIDATE_URL ) ) {
			$clean[] = $line;
		}
	}
	return implode( "\n", $clean );
}

function swivo_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>Swivo Headless</h1>
		<p>Configuration du backend headless Swivo. SPA Vite/React consomme <code>/wp-json/swivo/v1/*</code>.</p>

		<h2>Endpoints exposés</h2>
		<ul style="list-style: disc inside; margin: 8px 0 24px;">
			<li><code>GET <?php echo esc_html( rest_url( 'swivo/v1/formes' ) ); ?></code></li>
			<li><code>GET <?php echo esc_html( rest_url( 'swivo/v1/faq' ) ); ?></code></li>
			<li><code>GET <?php echo esc_html( rest_url( 'swivo/v1/pricing' ) ); ?></code></li>
			<li><code>POST <?php echo esc_html( rest_url( 'swivo/v1/dossier' ) ); ?></code></li>
			<li><code>GET <?php echo esc_html( rest_url( 'wp/v2/posts' ) ); ?></code> (blog natif WP)</li>
		</ul>

		<form method="post" action="options.php">
			<?php settings_fields( 'swivo_settings' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_creation_price">Tarif création</label></th>
					<td><input id="swivo_creation_price" type="text" name="swivo_creation_price" value="<?php echo esc_attr( get_option( 'swivo_creation_price', '29,90 €' ) ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_gestion_price">Tarif gestion (mensuel)</label></th>
					<td><input id="swivo_gestion_price" type="text" name="swivo_gestion_price" value="<?php echo esc_attr( get_option( 'swivo_gestion_price', '9,90 €' ) ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_allowed_origins">Origines CORS supplémentaires</label></th>
					<td>
						<textarea id="swivo_allowed_origins" name="swivo_allowed_origins" rows="4" cols="60" placeholder="https://swivo.fr&#10;https://staging.swivo.fr"><?php echo esc_textarea( get_option( 'swivo_allowed_origins', '' ) ); ?></textarea>
						<p class="description">Un domaine par ligne. <code>localhost:5173</code> est déjà autorisé.</p>
					</td>
				</tr>
			</table>

			<h2>WooCommerce — produits</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_wc_creation_product_id">ID produit « Création » (29,90 €)</label></th>
					<td>
						<input id="swivo_wc_creation_product_id" type="number" name="swivo_wc_creation_product_id" value="<?php echo esc_attr( get_option( 'swivo_wc_creation_product_id', '' ) ); ?>" class="small-text" />
						<p class="description">ID du produit WC simple (paiement unique).</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_wc_gestion_product_id">ID produit « Gestion » (9,90 €/mois)</label></th>
					<td>
						<input id="swivo_wc_gestion_product_id" type="number" name="swivo_wc_gestion_product_id" value="<?php echo esc_attr( get_option( 'swivo_wc_gestion_product_id', '' ) ); ?>" class="small-text" />
						<p class="description">ID du produit WC abonnement (WC Subscriptions ou Stripe recurring).</p>
					</td>
				</tr>
			</table>

			<h2>Frontend SPA</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_spa_url">URL publique du SPA</label></th>
					<td>
						<input id="swivo_spa_url" type="url" name="swivo_spa_url" value="<?php echo esc_attr( get_option( 'swivo_spa_url', '' ) ); ?>" class="regular-text" placeholder="https://swivo.fr" />
						<p class="description">Utilisée pour les redirections Stripe et les liens dans les emails. Laisser vide pour fallback sur l’URL WP.</p>
					</td>
				</tr>
			</table>

			<h2>Paid Memberships Pro — abonnement Gestion</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_pmp_gestion_level_id">ID du niveau « Gestion »</label></th>
					<td>
						<input id="swivo_pmp_gestion_level_id" type="number" min="0" name="swivo_pmp_gestion_level_id" value="<?php echo esc_attr( get_option( 'swivo_pmp_gestion_level_id', '' ) ); ?>" class="small-text" />
						<p class="description">ID du niveau PMP mappé à l'abonnement gestion. Memberships → Membership Levels.</p>
					</td>
				</tr>
			</table>

			<h2>Intégrations IA</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_ai_provider">Provider IA actif</label></th>
					<td>
						<?php $prov = (string) get_option( 'swivo_ai_provider', 'anthropic' ); ?>
						<select id="swivo_ai_provider" name="swivo_ai_provider">
							<option value="anthropic"  <?php selected( $prov, 'anthropic' );  ?>>Anthropic (Claude)</option>
							<option value="google"     <?php selected( $prov, 'google' );     ?>>Google (Gemini)</option>
							<option value="deepseek"   <?php selected( $prov, 'deepseek' );   ?>>DeepSeek (gratuit / pay-as-you-go)</option>
							<option value="groq"       <?php selected( $prov, 'groq' );       ?>>Groq (free tier, llama)</option>
							<option value="mistral"    <?php selected( $prov, 'mistral' );    ?>>Mistral</option>
							<option value="openrouter" <?php selected( $prov, 'openrouter' ); ?>>OpenRouter (aggregator)</option>
						</select>
						<p class="description">Le plugin <em>AI Provider for Anthropic</em> / <em>AI Provider for Google</em> gère les clés. Cette option choisit lequel utiliser pour <code>/chat/turn</code>.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_anthropic_key">Clé API Anthropic — fallback</label></th>
					<td>
						<input id="swivo_anthropic_key" type="password" autocomplete="off" name="swivo_anthropic_key" value="<?php echo esc_attr( get_option( 'swivo_anthropic_key', '' ) ); ?>" class="regular-text" />
						<p class="description">Utilisée seulement si le plugin <em>AI Provider for Anthropic</em> n'est pas installé.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_anthropic_model">Modèle Anthropic (fallback)</label></th>
					<td>
						<input id="swivo_anthropic_model" type="text" name="swivo_anthropic_model" value="<?php echo esc_attr( get_option( 'swivo_anthropic_model', 'claude-sonnet-4-6' ) ); ?>" class="regular-text" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_stripe_secret">Stripe — clé secrète</label></th>
					<td>
						<input id="swivo_stripe_secret" type="password" autocomplete="off" name="swivo_stripe_secret" value="<?php echo esc_attr( get_option( 'swivo_stripe_secret', '' ) ); ?>" class="regular-text" placeholder="sk_live_…" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_stripe_webhook_secret">Stripe — secret webhook</label></th>
					<td>
						<input id="swivo_stripe_webhook_secret" type="password" autocomplete="off" name="swivo_stripe_webhook_secret" value="<?php echo esc_attr( get_option( 'swivo_stripe_webhook_secret', '' ) ); ?>" class="regular-text" placeholder="whsec_…" />
						<p class="description">Endpoint à enregistrer côté Stripe : <code><?php echo esc_html( rest_url( 'swivo/v1/stripe/webhook' ) ); ?></code></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_stripe_creation_amount_cents">Montant création (centimes)</label></th>
					<td>
						<input id="swivo_stripe_creation_amount_cents" type="number" min="100" name="swivo_stripe_creation_amount_cents" value="<?php echo esc_attr( get_option( 'swivo_stripe_creation_amount_cents', 2990 ) ); ?>" class="small-text" />
						<p class="description">2990 = 29,90 €</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_stripe_gestion_amount_cents">Montant gestion (centimes / mois)</label></th>
					<td>
						<input id="swivo_stripe_gestion_amount_cents" type="number" min="100" name="swivo_stripe_gestion_amount_cents" value="<?php echo esc_attr( get_option( 'swivo_stripe_gestion_amount_cents', 990 ) ); ?>" class="small-text" />
						<p class="description">990 = 9,90 €/mois (ignoré si Price ID Stripe fourni ci-dessous)</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_stripe_gestion_price_id">Stripe — Price ID gestion (optionnel)</label></th>
					<td>
						<input id="swivo_stripe_gestion_price_id" type="text" name="swivo_stripe_gestion_price_id" value="<?php echo esc_attr( get_option( 'swivo_stripe_gestion_price_id', '' ) ); ?>" class="regular-text" placeholder="price_…" />
					</td>
				</tr>
			</table>

			<h2>Guichet unique INPI (mandataire)</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_inpi_base_url">URL API mandataire</label></th>
					<td>
						<input id="swivo_inpi_base_url" type="url" name="swivo_inpi_base_url" value="<?php echo esc_attr( get_option( 'swivo_inpi_base_url', '' ) ); ?>" class="regular-text" placeholder="https://api-mandataire.inpi.fr/v4" />
						<p class="description">Laisser vide pour rester en <strong>mode manuel</strong> (export JSON).</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_inpi_token">Token mandataire (Bearer)</label></th>
					<td>
						<input id="swivo_inpi_token" type="password" autocomplete="off" name="swivo_inpi_token" value="<?php echo esc_attr( get_option( 'swivo_inpi_token', '' ) ); ?>" class="regular-text" />
					</td>
				</tr>
			</table>

			<h2>OAuth / Connexion sociale</h2>
			<p class="description" style="margin-bottom:12px">
				Configure les fournisseurs OAuth utilisés par les boutons « Se connecter avec... » du SPA.
				<br><strong>URL de callback à enregistrer chez le fournisseur :</strong>
			</p>
			<?php $google = (array) get_option( 'swivo_oauth_google', array() ); ?>
			<?php $fc     = (array) get_option( 'swivo_oauth_france_connect', array() ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th colspan="2" style="padding-top:0">
						<h3 style="margin:0">🔵 Google</h3>
						<p class="description" style="font-weight:400">
							Console : <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">console.cloud.google.com</a> → Identifiants → OAuth 2.0.
							Type : <strong>Application Web</strong>. Origines JS autorisées : <code><?php echo esc_html( home_url() ); ?></code>.
						</p>
					</th>
				</tr>
				<tr>
					<th scope="row"><label>URL de redirection à coller chez Google</label></th>
					<td><code style="user-select:all;background:#f1f5f9;padding:6px 10px;border-radius:6px;display:inline-block"><?php echo esc_html( rest_url( 'swivo/v1/auth/google/callback' ) ); ?></code></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_oauth_google_client_id">Google — Client ID</label></th>
					<td>
						<input id="swivo_oauth_google_client_id" type="text" name="swivo_oauth_google[client_id]" value="<?php echo esc_attr( $google['client_id'] ?? '' ); ?>" class="regular-text" placeholder="123456789-xxx.apps.googleusercontent.com" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_oauth_google_client_secret">Google — Client secret</label></th>
					<td>
						<input id="swivo_oauth_google_client_secret" type="password" autocomplete="off" name="swivo_oauth_google[client_secret]" value="<?php echo esc_attr( $google['client_secret'] ?? '' ); ?>" class="regular-text" placeholder="GOCSPX-…" />
						<p class="description">État : <?php echo ! empty( $google['client_id'] ) && ! empty( $google['client_secret'] ) ? '<strong style="color:#059669">✓ configuré</strong>' : '<span style="color:#b45309">⚠ non configuré</span>'; ?></p>
					</td>
				</tr>

				<tr>
					<th colspan="2" style="padding-top:24px">
						<h3 style="margin:0">🇫🇷 FranceConnect</h3>
						<p class="description" style="font-weight:400">
							Bac à sable : <a href="https://partenaires.franceconnect.gouv.fr" target="_blank" rel="noopener">partenaires.franceconnect.gouv.fr</a> (FC+ eIDAS substantiel pour micro).
							Production : agrément requis. Les endpoints sandbox sont câblés par défaut.
						</p>
					</th>
				</tr>
				<tr>
					<th scope="row"><label>URL de redirection FC</label></th>
					<td><code style="user-select:all;background:#f1f5f9;padding:6px 10px;border-radius:6px;display:inline-block"><?php echo esc_html( rest_url( 'swivo/v1/auth/france-connect/callback' ) ); ?></code></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_oauth_fc_client_id">FranceConnect — Client ID</label></th>
					<td>
						<input id="swivo_oauth_fc_client_id" type="text" name="swivo_oauth_france_connect[client_id]" value="<?php echo esc_attr( $fc['client_id'] ?? '' ); ?>" class="regular-text" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_oauth_fc_client_secret">FranceConnect — Client secret</label></th>
					<td>
						<input id="swivo_oauth_fc_client_secret" type="password" autocomplete="off" name="swivo_oauth_france_connect[client_secret]" value="<?php echo esc_attr( $fc['client_secret'] ?? '' ); ?>" class="regular-text" />
						<p class="description">État : <?php echo ! empty( $fc['client_id'] ) && ! empty( $fc['client_secret'] ) ? '<strong style="color:#059669">✓ configuré</strong>' : '<span style="color:#b45309">⚠ non configuré</span>'; ?></p>
					</td>
				</tr>
			</table>

			<h2>LLM gratuits / alternatifs</h2>
			<p class="description" style="margin-bottom:12px">
				DeepSeek (très bon marché), Groq (inférence ultra-rapide, free tier), Mistral (crédits gratuits), OpenRouter (aggregator avec modèles <code>:free</code>).
				Sélectionnez le provider actif ci-dessus dans « Provider IA actif ».
			</p>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_deepseek_key">DeepSeek — Clé API</label></th>
					<td>
						<input id="swivo_deepseek_key" type="password" autocomplete="off" name="swivo_deepseek_key" value="<?php echo esc_attr( get_option( 'swivo_deepseek_key', '' ) ); ?>" class="regular-text" placeholder="sk-…" />
						<p class="description">Obtenir : <a href="https://platform.deepseek.com" target="_blank" rel="noopener">platform.deepseek.com</a> → API Keys.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_deepseek_model">DeepSeek — Modèle</label></th>
					<td><input id="swivo_deepseek_model" type="text" name="swivo_deepseek_model" value="<?php echo esc_attr( get_option( 'swivo_deepseek_model', 'deepseek-chat' ) ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_groq_key">Groq — Clé API</label></th>
					<td>
						<input id="swivo_groq_key" type="password" autocomplete="off" name="swivo_groq_key" value="<?php echo esc_attr( get_option( 'swivo_groq_key', '' ) ); ?>" class="regular-text" placeholder="gsk_…" />
						<p class="description">Obtenir : <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_groq_model">Groq — Modèle</label></th>
					<td><input id="swivo_groq_model" type="text" name="swivo_groq_model" value="<?php echo esc_attr( get_option( 'swivo_groq_model', 'llama-3.1-70b-versatile' ) ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_mistral_key">Mistral — Clé API</label></th>
					<td>
						<input id="swivo_mistral_key" type="password" autocomplete="off" name="swivo_mistral_key" value="<?php echo esc_attr( get_option( 'swivo_mistral_key', '' ) ); ?>" class="regular-text" />
						<p class="description"><a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener">console.mistral.ai/api-keys</a>.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_mistral_model">Mistral — Modèle</label></th>
					<td><input id="swivo_mistral_model" type="text" name="swivo_mistral_model" value="<?php echo esc_attr( get_option( 'swivo_mistral_model', 'mistral-small-latest' ) ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_openrouter_key">OpenRouter — Clé API</label></th>
					<td>
						<input id="swivo_openrouter_key" type="password" autocomplete="off" name="swivo_openrouter_key" value="<?php echo esc_attr( get_option( 'swivo_openrouter_key', '' ) ); ?>" class="regular-text" placeholder="sk-or-…" />
						<p class="description"><a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>. Modèles gratuits suffixés <code>:free</code>.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_openrouter_model">OpenRouter — Modèle</label></th>
					<td><input id="swivo_openrouter_model" type="text" name="swivo_openrouter_model" value="<?php echo esc_attr( get_option( 'swivo_openrouter_model', 'deepseek/deepseek-chat:free' ) ); ?>" class="regular-text" /></td>
				</tr>
			</table>

			<h2>Anti-bot / Cloudflare Turnstile</h2>
			<p class="description" style="margin-bottom:12px">
				Honeypot + min-time + IP throttle sont actifs par défaut. Turnstile renforce la protection sur les endpoints publics (register, dossier, draft, forgot).
				Obtenir une clé : <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener">dash.cloudflare.com → Turnstile</a>.
			</p>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="swivo_turnstile_site">Turnstile — Site key (public)</label></th>
					<td><input id="swivo_turnstile_site" type="text" name="swivo_turnstile_site" value="<?php echo esc_attr( get_option( 'swivo_turnstile_site', '' ) ); ?>" class="regular-text" placeholder="0x4AAAAAAA…" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="swivo_turnstile_secret">Turnstile — Secret (serveur)</label></th>
					<td>
						<input id="swivo_turnstile_secret" type="password" autocomplete="off" name="swivo_turnstile_secret" value="<?php echo esc_attr( get_option( 'swivo_turnstile_secret', '' ) ); ?>" class="regular-text" placeholder="0x4AAAAAAA…" />
						<p class="description">Vide = challenge désactivé (mais honeypot + throttle restent actifs).</p>
					</td>
				</tr>
			</table>

			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
