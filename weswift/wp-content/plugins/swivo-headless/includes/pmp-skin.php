<?php
/**
 * Habillage Swivo des pages PMP (checkout, account, billing, confirmation).
 *
 * Sans ce fichier, les utilisateurs basculent du SPA Swivo (design soigné) vers
 * une page WordPress brute aux couleurs du thème → effet « page bizarre ». On
 * masque le chrome WP et on applique l'identité Swivo (police, couleurs, logo)
 * via une CSS injectée à l'admin_bar/header sur les pages PMP uniquement.
 *
 * Stratégie : on ne réécrit pas les templates PMP (fragile aux upgrades), on
 * applique un thème CSS sur les classes `pmpro_*` que PMP émet déjà.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Détecte si la requête en cours est une page PMP (checkout, account, etc.). */
function swivo_is_pmpro_page() {
	if ( ! function_exists( 'pmpro_is_checkout' ) && ! function_exists( 'pmpro_url' ) ) return false;
	global $post;
	if ( ! ( $post instanceof WP_Post ) ) return false;
	$pmpro_pages = (array) get_option( 'pmpro_pages', array() );
	return in_array( (int) $post->ID, array_map( 'intval', $pmpro_pages ), true );
}

/** Masque l'admin bar sur les pages PMP côté front pour ne pas alourdir l'UI. */
add_action( 'after_setup_theme', function () {
	if ( swivo_is_pmpro_page() && ! current_user_can( 'manage_options' ) ) {
		show_admin_bar( false );
	}
} );

/** Body class pour scoper la CSS Swivo et bouton retour SPA. */
add_filter( 'body_class', function ( $classes ) {
	if ( swivo_is_pmpro_page() ) {
		$classes[] = 'swivo-pmpro-skin';
	}
	return $classes;
} );

/** CSS Swivo branding — injectée uniquement sur pages PMP. */
add_action( 'wp_head', function () {
	if ( ! swivo_is_pmpro_page() ) return;
	$primary_600 = '#2563eb';
	$primary_700 = '#1d4ed8';
	$accent      = '#ec4899';
	$ink         = '#0f172a';
	$ink_muted   = '#475569';
	$surface     = '#ffffff';
	$bg          = '#f8fafc';
	$border      = '#e2e8f0';
	$radius      = '12px';
	?>
	<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
	<style id="swivo-pmpro-skin">
		body.swivo-pmpro-skin {
			background: <?php echo esc_attr( $bg ); ?> !important;
			color: <?php echo esc_attr( $ink ); ?> !important;
			font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
			font-size: 16px;
			line-height: 1.6;
			-webkit-font-smoothing: antialiased;
		}
		body.swivo-pmpro-skin #page,
		body.swivo-pmpro-skin .site,
		body.swivo-pmpro-skin .site-content,
		body.swivo-pmpro-skin main { max-width: 720px; margin: 0 auto; padding: 24px 20px 64px; }
		body.swivo-pmpro-skin .site-header,
		body.swivo-pmpro-skin .site-footer,
		body.swivo-pmpro-skin .entry-header { display: none !important; }
		body.swivo-pmpro-skin .swivo-pmpro-topbar {
			display: flex; align-items: center; justify-content: space-between;
			max-width: 720px; margin: 0 auto; padding: 18px 20px;
		}
		body.swivo-pmpro-skin .swivo-pmpro-topbar a {
			color: <?php echo esc_attr( $primary_700 ); ?>; text-decoration: none; font-weight: 600;
		}
		body.swivo-pmpro-skin .swivo-pmpro-topbar .swivo-pmpro-brand {
			font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 22px;
			color: <?php echo esc_attr( $primary_700 ); ?>;
		}

		body.swivo-pmpro-skin h1,
		body.swivo-pmpro-skin h2,
		body.swivo-pmpro-skin h3 {
			font-family: 'Plus Jakarta Sans', sans-serif !important;
			font-weight: 700; color: <?php echo esc_attr( $ink ); ?>;
			letter-spacing: -0.01em;
		}
		body.swivo-pmpro-skin h1 { font-size: 28px; margin: 8px 0 16px; }

		body.swivo-pmpro-skin .pmpro_form,
		body.swivo-pmpro-skin .pmpro_checkout,
		body.swivo-pmpro-skin .pmpro_account {
			background: <?php echo esc_attr( $surface ); ?>;
			border: 1px solid <?php echo esc_attr( $border ); ?>;
			border-radius: 20px;
			padding: 28px;
			box-shadow: 0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04);
		}

		body.swivo-pmpro-skin .pmpro_checkout-fields,
		body.swivo-pmpro-skin fieldset {
			border: none; padding: 0; margin: 0 0 18px;
		}
		body.swivo-pmpro-skin legend {
			font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
			color: <?php echo esc_attr( $ink_muted ); ?>; font-weight: 600; padding: 0; margin: 0 0 8px;
		}

		body.swivo-pmpro-skin label {
			display: block; font-size: 14px; font-weight: 500;
			color: <?php echo esc_attr( $ink ); ?>; margin-bottom: 6px;
		}
		body.swivo-pmpro-skin input[type='text'],
		body.swivo-pmpro-skin input[type='email'],
		body.swivo-pmpro-skin input[type='tel'],
		body.swivo-pmpro-skin input[type='number'],
		body.swivo-pmpro-skin input[type='password'],
		body.swivo-pmpro-skin select,
		body.swivo-pmpro-skin textarea {
			width: 100%; padding: 12px 14px; font-size: 16px;
			background: <?php echo esc_attr( $surface ); ?>;
			border: 1px solid <?php echo esc_attr( $border ); ?>;
			border-radius: <?php echo esc_attr( $radius ); ?>;
			color: <?php echo esc_attr( $ink ); ?>;
			transition: border-color .15s ease, box-shadow .15s ease;
			margin-bottom: 12px;
		}
		body.swivo-pmpro-skin input:focus, body.swivo-pmpro-skin select:focus, body.swivo-pmpro-skin textarea:focus {
			outline: none;
			border-color: <?php echo esc_attr( $primary_600 ); ?>;
			box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
		}

		body.swivo-pmpro-skin .pmpro_btn,
		body.swivo-pmpro-skin input[type='submit'],
		body.swivo-pmpro-skin button[type='submit'] {
			display: inline-flex; align-items: center; justify-content: center;
			padding: 12px 22px; font-size: 14px; font-weight: 600;
			border-radius: 999px; border: none; cursor: pointer;
			background: linear-gradient(120deg, <?php echo esc_attr( $primary_600 ); ?> 0%, <?php echo esc_attr( $accent ); ?> 50%, <?php echo esc_attr( $primary_600 ); ?> 100%);
			background-size: 220% 100%;
			color: #fff;
			box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
			transition: background-position .4s ease, transform .2s ease;
		}
		body.swivo-pmpro-skin .pmpro_btn:hover,
		body.swivo-pmpro-skin input[type='submit']:hover { background-position: 100% 50%; transform: translateY(-1px); }

		body.swivo-pmpro-skin .pmpro_btn-cancel,
		body.swivo-pmpro-skin .pmpro_btn-secondary {
			background: <?php echo esc_attr( $surface ); ?> !important;
			color: <?php echo esc_attr( $ink ); ?> !important;
			border: 1px solid <?php echo esc_attr( $border ); ?> !important;
			box-shadow: none;
		}

		body.swivo-pmpro-skin .pmpro_message,
		body.swivo-pmpro-skin .pmpro_error,
		body.swivo-pmpro-skin .pmpro_success {
			padding: 12px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 14px;
		}
		body.swivo-pmpro-skin .pmpro_error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
		body.swivo-pmpro-skin .pmpro_success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
		body.swivo-pmpro-skin .pmpro_message { background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; }

		body.swivo-pmpro-skin .pmpro_level-cost,
		body.swivo-pmpro-skin .pmpro_level-price-display {
			font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
			color: <?php echo esc_attr( $primary_700 ); ?>; font-size: 22px;
		}

		body.swivo-pmpro-skin a { color: <?php echo esc_attr( $primary_700 ); ?>; }
		body.swivo-pmpro-skin a:hover { text-decoration: underline; }

		body.swivo-pmpro-skin .swivo-pmpro-trust {
			margin: 18px auto 0; max-width: 720px; padding: 14px 18px;
			background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
			border-radius: 14px; font-size: 13px;
			display: flex; gap: 10px; align-items: flex-start;
		}
	</style>
	<?php
} );

/** Topbar + bandeau confiance — injectés au début du <body>. */
add_action( 'wp_body_open', function () {
	if ( ! swivo_is_pmpro_page() ) return;
	$home    = esc_url( home_url( '/' ) );
	$tarifs  = esc_url( home_url( '/tarifs' ) );
	?>
	<div class="swivo-pmpro-topbar">
		<a href="<?php echo $home; ?>" class="swivo-pmpro-brand">Swivo</a>
		<a href="<?php echo $tarifs; ?>">← Retour aux tarifs</a>
	</div>
	<div class="swivo-pmpro-trust">
		<span>🔒</span>
		<span><strong>Paiement sécurisé Stripe.</strong> Aucun compte bancaire imposé — vous gardez votre banque actuelle. Résiliable en 1 clic depuis votre espace.</span>
	</div>
	<?php
} );

/** Redirige vers le SPA après confirmation PMP plutôt que la page WP `confirmation`. */
add_filter( 'pmpro_confirmation_url', function ( $url, $user_id, $level ) {
	unset( $user_id, $level );
	return home_url( '/espace-createur?subscribed=1' );
}, 10, 3 );
