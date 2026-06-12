<?php
/**
 * Admin enhancements for the `swivo_dossier` CPT — status workflow,
 * custom columns, quick actions, and an "Export INPI" button on the
 * single-edit screen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SWIVO_DOSSIER_STATUSES = array(
	'draft'             => 'Brouillon (en cours)',
	'pending'           => 'À traiter',
	'awaiting_payment'  => 'Paiement en attente',
	'paid'              => 'Payé — à déposer',
	'deposited'         => 'Déposé Guichet unique',
	'completed'         => 'Immatriculé',
	'rejected'          => 'Rejeté',
);

add_filter( 'manage_swivo_dossier_posts_columns', function ( $cols ) {
	$new = array();
	foreach ( $cols as $key => $val ) {
		$new[ $key ] = $val;
		if ( 'title' === $key ) {
			$new['swivo_forme']    = 'Forme';
			$new['swivo_status']   = 'Statut';
			$new['swivo_progress'] = 'Complétude';
			$new['swivo_email']    = 'Email';
			$new['swivo_saved']    = 'Dernière sauvegarde';
		}
	}
	return $new;
} );

add_action( 'manage_swivo_dossier_posts_custom_column', function ( $col, $post_id ) {
	switch ( $col ) {
		case 'swivo_forme':
			echo esc_html( strtoupper( (string) get_post_meta( $post_id, 'forme', true ) ) ?: '—' );
			break;
		case 'swivo_status':
			$status = (string) get_post_meta( $post_id, 'status', true ) ?: 'pending';
			$label  = SWIVO_DOSSIER_STATUSES[ $status ] ?? $status;
			$color  = swivo_status_color( $status );
			printf(
				'<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;background:%1$s;color:#fff">%2$s</span>',
				esc_attr( $color ),
				esc_html( $label )
			);
			break;
		case 'swivo_email':
			echo esc_html( (string) get_post_meta( $post_id, 'email', true ) ?: '—' );
			break;
		case 'swivo_progress':
			$score = (int) get_post_meta( $post_id, 'score_completude', true );
			$color = $score >= 90 ? '#059669' : ( $score >= 50 ? '#b45309' : '#94a3b8' );
			printf(
				'<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden;max-width:80px"><div style="width:%1$d%%;height:100%%;background:%2$s"></div></div><span style="font-size:11px;color:#475569">%1$d%%</span></div>',
				$score,
				esc_attr( $color )
			);
			break;
		case 'swivo_saved':
			$saved = (string) get_post_meta( $post_id, 'last_saved_at', true );
			echo $saved ? esc_html( mysql2date( 'd/m/Y H:i', $saved ) ) : '—';
			break;
	}
}, 10, 2 );

function swivo_status_color( $status ) {
	return array(
		'draft'            => '#94a3b8',
		'pending'          => '#475569',
		'awaiting_payment' => '#b45309',
		'paid'             => '#1d4ed8',
		'deposited'        => '#7c3aed',
		'completed'        => '#059669',
		'rejected'         => '#dc2626',
	)[ $status ] ?? '#475569';
}

add_action( 'add_meta_boxes', function () {
	add_meta_box(
		'swivo_dossier_meta',
		'Swivo — Dossier',
		'swivo_render_dossier_meta_box',
		'swivo_dossier',
		'side',
		'high'
	);
} );

function swivo_render_dossier_meta_box( $post ) {
	wp_nonce_field( 'swivo_dossier_meta', 'swivo_dossier_meta_nonce' );
	$status = (string) get_post_meta( $post->ID, 'status', true ) ?: 'pending';
	$forme  = (string) get_post_meta( $post->ID, 'forme', true );
	$email  = (string) get_post_meta( $post->ID, 'email', true );
	$paid   = (string) get_post_meta( $post->ID, 'paid_at', true );
	?>
	<p>
		<label for="swivo_status" style="display:block;font-weight:600;margin-bottom:4px">Statut</label>
		<select name="swivo_status" id="swivo_status" style="width:100%">
			<?php foreach ( SWIVO_DOSSIER_STATUSES as $value => $label ) : ?>
				<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $status, $value ); ?>><?php echo esc_html( $label ); ?></option>
			<?php endforeach; ?>
		</select>
	</p>
	<p><strong>Forme :</strong> <?php echo esc_html( strtoupper( $forme ) ?: '—' ); ?></p>
	<p><strong>Email :</strong> <a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ?: '—' ); ?></a></p>
	<?php if ( $paid ) : ?>
		<p><strong>Payé le :</strong> <?php echo esc_html( $paid ); ?></p>
	<?php endif; ?>
	<hr/>
	<p>
		<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=swivo_export_inpi&dossier=' . $post->ID ), 'swivo_export_inpi' ) ); ?>" class="button button-primary">Exporter payload INPI (JSON)</a>
	</p>
	<?php
	echo apply_filters( 'swivo_dossier_meta_box_extra', '', $post->ID );
}

add_action( 'save_post_swivo_dossier', function ( $post_id ) {
	if ( ! isset( $_POST['swivo_dossier_meta_nonce'] ) || ! wp_verify_nonce( $_POST['swivo_dossier_meta_nonce'], 'swivo_dossier_meta' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( isset( $_POST['swivo_status'] ) ) {
		$status = sanitize_text_field( wp_unslash( $_POST['swivo_status'] ) );
		if ( isset( SWIVO_DOSSIER_STATUSES[ $status ] ) ) {
			$prev = (string) get_post_meta( $post_id, 'status', true );
			if ( $prev !== $status ) {
				update_post_meta( $post_id, 'status', $status );
				do_action( 'swivo_dossier_status_changed', $post_id, $status, $prev );
			}
		}
	}
} );

/**
 * Filter dossiers by status via the admin list "Tous / À traiter / Payé / …".
 */
add_filter( 'views_edit-swivo_dossier', function ( $views ) {
	$base = admin_url( 'edit.php?post_type=swivo_dossier' );
	$out = array( 'all' => $views['all'] ?? '<a href="' . esc_url( $base ) . '">Tous</a>' );
	foreach ( SWIVO_DOSSIER_STATUSES as $key => $label ) {
		$out[ $key ] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( add_query_arg( 'swivo_status', $key, $base ) ),
			esc_html( $label )
		);
	}
	return $out;
} );

add_action( 'pre_get_posts', function ( $q ) {
	if ( ! is_admin() || ! $q->is_main_query() ) {
		return;
	}
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || 'edit-swivo_dossier' !== $screen->id ) {
		return;
	}
	if ( ! empty( $_GET['swivo_status'] ) ) {
		$q->set( 'meta_query', array( array(
			'key'   => 'status',
			'value' => sanitize_text_field( wp_unslash( $_GET['swivo_status'] ) ),
		) ) );
	}
} );
