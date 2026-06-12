<?php
/**
 * Plugin Name: Swivo Headless
 * Plugin URI:  https://swivo.fr
 * Description: Backend headless pour le SPA Swivo. Expose les formes juridiques, la FAQ, les tarifs et les dossiers via /wp-json/swivo/v1/*. Gère le CORS pour le front Vite/React et l'enregistrement des dossiers de création.
 * Version:     0.1.0
 * Author:      Swivo
 * License:     GPL v2 or later
 * Text Domain: swivo
 * Requires PHP: 7.4
 * Requires at least: 6.5
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SWIVO_HEADLESS_VERSION', '0.1.0' );
define( 'SWIVO_HEADLESS_DIR', plugin_dir_path( __FILE__ ) );
define( 'SWIVO_HEADLESS_URL', plugin_dir_url( __FILE__ ) );

require_once SWIVO_HEADLESS_DIR . 'includes/cpt.php';
require_once SWIVO_HEADLESS_DIR . 'includes/rest.php';
require_once SWIVO_HEADLESS_DIR . 'includes/cors.php';
require_once SWIVO_HEADLESS_DIR . 'includes/seeds.php';
require_once SWIVO_HEADLESS_DIR . 'includes/settings.php';
require_once SWIVO_HEADLESS_DIR . 'includes/auth.php';
require_once SWIVO_HEADLESS_DIR . 'includes/claude.php';
require_once SWIVO_HEADLESS_DIR . 'includes/stripe.php';
require_once SWIVO_HEADLESS_DIR . 'includes/dossier-admin.php';
require_once SWIVO_HEADLESS_DIR . 'includes/inpi.php';
require_once SWIVO_HEADLESS_DIR . 'includes/dossier-export.php';
require_once SWIVO_HEADLESS_DIR . 'includes/favicon.php';
require_once SWIVO_HEADLESS_DIR . 'includes/antibot.php';
require_once SWIVO_HEADLESS_DIR . 'includes/my-dossiers.php';
require_once SWIVO_HEADLESS_DIR . 'includes/drafts.php';
require_once SWIVO_HEADLESS_DIR . 'includes/pilotage.php';
require_once SWIVO_HEADLESS_DIR . 'includes/documents.php';
require_once SWIVO_HEADLESS_DIR . 'includes/oauth.php';
require_once SWIVO_HEADLESS_DIR . 'includes/admin-clients.php';
require_once SWIVO_HEADLESS_DIR . 'includes/admin-cpt-cols.php';
require_once SWIVO_HEADLESS_DIR . 'includes/emails.php';
require_once SWIVO_HEADLESS_DIR . 'includes/gestion.php';
require_once SWIVO_HEADLESS_DIR . 'includes/inpi-client.php';
require_once SWIVO_HEADLESS_DIR . 'includes/smtp.php';
require_once SWIVO_HEADLESS_DIR . 'includes/woocommerce.php';
require_once SWIVO_HEADLESS_DIR . 'includes/wc-style.php';
require_once SWIVO_HEADLESS_DIR . 'includes/billing.php';
require_once SWIVO_HEADLESS_DIR . 'includes/ai.php';
require_once SWIVO_HEADLESS_DIR . 'includes/pmp.php';
require_once SWIVO_HEADLESS_DIR . 'includes/pmp-skin.php';
require_once SWIVO_HEADLESS_DIR . 'includes/acf-fields.php';

/**
 * Boot — CPT registration on init.
 */
add_action( 'init', 'swivo_register_cpts' );

/**
 * Boot — REST routes on rest_api_init.
 */
add_action( 'rest_api_init', 'swivo_register_rest_routes' );

/**
 * Boot — CORS for the headless SPA. Must run before WP sends headers.
 */
add_action( 'init', 'swivo_setup_cors', 15 );

/**
 * Activation — register CPTs, seed default content, flush rewrites.
 */
register_activation_hook( __FILE__, function () {
	swivo_register_cpts();
	swivo_seed_default_content();
	flush_rewrite_rules();
} );

/**
 * Deactivation — flush rewrites (don't drop content, user might reactivate).
 */
register_deactivation_hook( __FILE__, function () {
	flush_rewrite_rules();
} );

/**
 * Admin settings page (Tarifs, allowed origins).
 */
add_action( 'admin_menu', 'swivo_register_settings_page' );
add_action( 'admin_init', 'swivo_register_settings' );
