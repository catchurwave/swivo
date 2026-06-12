<?php
/**
 * Documents upload — micro-entreprise.
 *
 * CPT swivo_document : stocke un fichier WP media + meta (slot, dossier_id, status).
 * Endpoints :
 *   GET  /me/documents              — liste des documents de l'utilisateur courant
 *   POST /me/documents              — upload (multipart/form-data : file + slot + draft_id?)
 *   DELETE /me/documents/{id}
 *
 * Stockage : WP Media Library standard (uploads/ folder). Lien attachment ↔ CPT
 * via meta. Sécurité : upload directory standard, MIME whitelist (image + PDF).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', function () {
	register_post_type( 'swivo_document', array(
		'labels' => array( 'name' => 'Documents', 'singular_name' => 'Document', 'menu_name' => 'Documents' ),
		'public' => false,
		'show_ui' => true,
		'show_in_rest' => false,
		'supports' => array( 'title', 'custom-fields' ),
		'menu_icon' => 'dashicons-paperclip',
		'menu_position' => 31,
		'capability_type' => 'post',
	) );
}, 11 );

add_action( 'rest_api_init', function () {
	$auth = function () { return is_user_logged_in(); };

	register_rest_route( 'swivo/v1', '/me/documents', array(
		array( 'methods' => 'GET',  'permission_callback' => $auth, 'callback' => 'swivo_documents_list' ),
		array( 'methods' => 'POST', 'permission_callback' => $auth, 'callback' => 'swivo_documents_upload' ),
	) );

	register_rest_route( 'swivo/v1', '/me/documents/(?P<id>\d+)', array(
		array( 'methods' => 'DELETE', 'permission_callback' => $auth, 'callback' => 'swivo_documents_delete' ),
	) );
} );

const SWIVO_DOC_ALLOWED_MIME = array(
	'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
	'application/pdf',
);

function swivo_documents_list() {
	$uid = get_current_user_id();
	$posts = get_posts( array(
		'post_type'      => 'swivo_document',
		'post_status'    => 'private',
		'posts_per_page' => 200,
		'meta_query'     => array( array( 'key' => 'user_id', 'value' => $uid ) ),
		'orderby'        => 'date',
		'order'          => 'DESC',
	) );
	$out = array();
	foreach ( $posts as $p ) {
		$attachment_id = (int) get_post_meta( $p->ID, 'attachment_id', true );
		$file_url      = $attachment_id ? wp_get_attachment_url( $attachment_id ) : null;
		$mime          = $attachment_id ? get_post_mime_type( $attachment_id ) : null;
		$out[] = array(
			'id'         => $p->ID,
			'slot'       => (string) get_post_meta( $p->ID, 'slot', true ),
			'draftId'    => (int) get_post_meta( $p->ID, 'draft_id', true ),
			'status'     => (string) get_post_meta( $p->ID, 'status', true ) ?: 'uploaded',
			'fileName'   => $p->post_title,
			'fileUrl'    => $file_url,
			'mime'       => $mime,
			'uploadedAt' => mysql2date( 'c', $p->post_date ),
			'size'       => (int) get_post_meta( $p->ID, 'size', true ),
		);
	}
	return rest_ensure_response( $out );
}

function swivo_documents_upload( WP_REST_Request $req ) {
	$uid = get_current_user_id();
	$files = $req->get_file_params();
	$body = $req->get_body_params();
	if ( empty( $files['file'] ) ) {
		return new WP_Error( 'no_file', 'Aucun fichier transmis (champ "file" requis)', array( 'status' => 400 ) );
	}
	$file = $files['file'];
	$slot = isset( $body['slot'] ) ? sanitize_text_field( $body['slot'] ) : 'autre';
	$draft_id = isset( $body['draft_id'] ) ? (int) $body['draft_id'] : 0;

	// Reject draft_id only if it belongs to ANOTHER user. Anonymous drafts (no
	// user_id meta yet) remain attachable so users uploading mid-wizard before
	// account claim still work. Auto-bind to current user once attached.
	if ( $draft_id ) {
		$draft = get_post( $draft_id );
		$draft_owner = (int) get_post_meta( $draft_id, 'user_id', true );
		if ( ! $draft || 'swivo_dossier' !== $draft->post_type ) {
			return new WP_Error( 'bad_draft', 'Brouillon introuvable.', array( 'status' => 404 ) );
		}
		if ( $draft_owner && $draft_owner !== $uid ) {
			return new WP_Error( 'bad_draft', 'Brouillon appartenant à un autre compte.', array( 'status' => 403 ) );
		}
		if ( ! $draft_owner && $uid ) {
			// First touch by the logged-in user — claim the draft.
			update_post_meta( $draft_id, 'user_id', $uid );
		}
	}

	// PHP-level error from the upload itself (size > post_max_size, partial, etc).
	if ( isset( $file['error'] ) && (int) $file['error'] !== UPLOAD_ERR_OK ) {
		$msg = swivo_upload_err_msg( (int) $file['error'] );
		return new WP_Error( 'upload_php_error', $msg, array( 'status' => 400 ) );
	}

	if ( $file['size'] > 10 * 1024 * 1024 ) {
		return new WP_Error( 'too_large', 'Fichier > 10 Mo.', array( 'status' => 413 ) );
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	// Server-side MIME detection with multi-strategy fallback (WP core,
	// then finfo on magic bytes, then extension whitelist) — needed because
	// HEIC/HEIF from iOS isn't in WP's default mime list.
	$server_mime = swivo_detect_mime( $file['tmp_name'], $file['name'] );
	if ( ! $server_mime || ! in_array( $server_mime, SWIVO_DOC_ALLOWED_MIME, true ) ) {
		return new WP_Error(
			'bad_mime',
			'Type de fichier non supporté (' . ( $server_mime ?: 'inconnu' ) . '). Formats acceptés : JPG, PNG, WebP, HEIC, PDF.',
			array( 'status' => 415 )
		);
	}
	$file['type'] = $server_mime;

	$overrides = array(
		'test_form' => false,
		'mimes' => array_merge(
			wp_get_mime_types(),
			array(
				'heic|heif' => 'image/heic',
				'webp'      => 'image/webp',
			)
		),
	);
	$uploaded = wp_handle_upload( $file, $overrides );
	if ( isset( $uploaded['error'] ) ) {
		return new WP_Error( 'upload_failed', $uploaded['error'], array( 'status' => 500 ) );
	}

	$attachment_id = wp_insert_attachment( array(
		'post_mime_type' => $uploaded['type'],
		'post_title'     => sanitize_file_name( $file['name'] ),
		'post_status'    => 'private',
		'post_parent'    => 0,
	), $uploaded['file'] );

	if ( is_wp_error( $attachment_id ) ) {
		return new WP_Error( 'attach_failed', 'Erreur attachment.', array( 'status' => 500 ) );
	}

	$metadata = wp_generate_attachment_metadata( $attachment_id, $uploaded['file'] );
	wp_update_attachment_metadata( $attachment_id, $metadata );

	$post_id = wp_insert_post( array(
		'post_type'    => 'swivo_document',
		'post_status'  => 'private',
		'post_title'   => sanitize_file_name( $file['name'] ),
	), true );
	if ( is_wp_error( $post_id ) ) {
		wp_delete_attachment( $attachment_id, true );
		return new WP_Error( 'doc_failed', 'Erreur création doc.', array( 'status' => 500 ) );
	}

	update_post_meta( $post_id, 'user_id', $uid );
	update_post_meta( $post_id, 'attachment_id', $attachment_id );
	update_post_meta( $post_id, 'slot', $slot );
	update_post_meta( $post_id, 'draft_id', $draft_id );
	update_post_meta( $post_id, 'status', 'uploaded' );
	update_post_meta( $post_id, 'size', (int) $file['size'] );

	return rest_ensure_response( array(
		'id'         => $post_id,
		'slot'       => $slot,
		'status'     => 'uploaded',
		'fileName'   => $file['name'],
		'fileUrl'    => wp_get_attachment_url( $attachment_id ),
		'mime'       => $uploaded['type'],
		'uploadedAt' => current_time( 'c' ),
		'size'       => (int) $file['size'],
	) );
}

function swivo_documents_delete( WP_REST_Request $req ) {
	$uid = get_current_user_id();
	$post_id = (int) $req['id'];
	$owner = (int) get_post_meta( $post_id, 'user_id', true );
	if ( $owner !== $uid ) {
		return new WP_Error( 'forbidden', 'Accès refusé', array( 'status' => 403 ) );
	}
	$attachment_id = (int) get_post_meta( $post_id, 'attachment_id', true );
	if ( $attachment_id ) wp_delete_attachment( $attachment_id, true );
	wp_delete_post( $post_id, true );
	return rest_ensure_response( array( 'ok' => true ) );
}

/**
 * Whitelist HEIC + WebP MIME so wp_handle_upload accepts them. HEIC est le
 * format par défaut des photos iPhone — sans cet ajout l'upload échoue
 * silencieusement avec « type non autorisé ».
 */
add_filter( 'upload_mimes', function ( $mimes ) {
	$mimes['heic'] = 'image/heic';
	$mimes['heif'] = 'image/heif';
	$mimes['webp'] = 'image/webp';
	return $mimes;
} );

/**
 * wp_check_filetype_and_ext renvoie un MIME vide pour HEIC (extension non
 * reconnue par WP). On ré-injecte le MIME en se basant sur l'extension.
 */
add_filter( 'wp_check_filetype_and_ext', function ( $data, $file, $filename, $mimes, $real_mime ) {
	unset( $file, $mimes, $real_mime );
	if ( ! empty( $data['type'] ) ) return $data;
	$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );
	$map = array(
		'heic' => 'image/heic',
		'heif' => 'image/heif',
		'webp' => 'image/webp',
		'jpg'  => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'png'  => 'image/png',
		'pdf'  => 'application/pdf',
	);
	if ( isset( $map[ $ext ] ) ) {
		$data['ext']  = $ext;
		$data['type'] = $map[ $ext ];
	}
	return $data;
}, 10, 5 );

function swivo_detect_mime( $tmp_path, $filename ) {
	// 1. Try WP's combined check (extension + magic bytes).
	$check = wp_check_filetype_and_ext( $tmp_path, $filename );
	if ( ! empty( $check['type'] ) ) return $check['type'];

	// 2. finfo on magic bytes.
	if ( function_exists( 'finfo_open' ) ) {
		$f = finfo_open( FILEINFO_MIME_TYPE );
		if ( $f ) {
			$m = finfo_file( $f, $tmp_path );
			finfo_close( $f );
			if ( $m ) return $m;
		}
	}

	// 3. Extension whitelist as last resort.
	$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );
	$map = array( 'heic' => 'image/heic', 'heif' => 'image/heif', 'webp' => 'image/webp', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'pdf' => 'application/pdf' );
	return $map[ $ext ] ?? '';
}

function swivo_upload_err_msg( $code ) {
	switch ( $code ) {
		case UPLOAD_ERR_INI_SIZE:   return 'Fichier trop volumineux (limite serveur PHP).';
		case UPLOAD_ERR_FORM_SIZE:  return 'Fichier trop volumineux (limite formulaire).';
		case UPLOAD_ERR_PARTIAL:    return 'Upload partiel — réessayez.';
		case UPLOAD_ERR_NO_FILE:    return 'Aucun fichier reçu.';
		case UPLOAD_ERR_NO_TMP_DIR: return 'Dossier temporaire serveur manquant.';
		case UPLOAD_ERR_CANT_WRITE: return 'Impossible d\'écrire sur le disque serveur.';
		case UPLOAD_ERR_EXTENSION:  return 'Extension PHP a stoppé l\'upload.';
		default:                    return 'Erreur d\'upload (code ' . $code . ').';
	}
}
