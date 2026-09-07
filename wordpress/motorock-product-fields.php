<?php
/**
 * Plugin Name: Motorock Product Fields
 * Description: Exposes ACF product fields (showroom_available, motorcycle_specs_html, lifestyle gallery, product video, is_new) to REST and WPGraphQL metaData.
 * Version: 1.2.4
 *
 * Install: copy to wp-content/mu-plugins/motorock-product-fields.php
 */

defined( 'ABSPATH' ) || exit;

const MOTOROCK_LIFESTYLE_GALLERY_ACF = 'motorcycle_lifestyle_gallery';
const MOTOROCK_LIFESTYLE_GALLERY_META = '_motorock_lifestyle_gallery';

const MOTOROCK_PRODUCT_GRAPHQL_META_KEYS = array(
	'showroom_available',
	'is_new',
	'motorcycle_specs_html',
	'motorcycle_specs_source_url',
	'product_video_url',
	'size_guide_slug',
	MOTOROCK_LIFESTYLE_GALLERY_META,
	'_motorock_ai_seo_title',
	'_motorock_ai_seo_meta_description',
	'_motorock_ai_seo_keywords',
	'_motorock_supplier_description',
	'_motorock_motorcycle_specs',
	'_motorock_related_slugs',
);

/**
 * Register public product meta for REST consumers.
 */
add_action(
	'init',
	function () {
		foreach ( MOTOROCK_PRODUCT_GRAPHQL_META_KEYS as $meta_key ) {
			register_post_meta(
				'product',
				$meta_key,
				array(
					'type'              => 'string',
					'single'            => true,
					'show_in_rest'      => true,
					'auth_callback'     => function () {
						return current_user_can( 'edit_products' );
					},
				)
			);
		}
	}
);

/**
 * WPGraphQL only exposes whitelisted meta keys on product metaData.
 */
add_filter(
	'graphql_post_object_meta_keys',
	function ( $keys, $post ) {
		if ( $post instanceof WP_Post && $post->post_type === 'product' ) {
			return array_values(
				array_unique(
					array_merge( $keys, MOTOROCK_PRODUCT_GRAPHQL_META_KEYS )
				)
			);
		}

		return $keys;
	},
	10,
	2
);

/**
 * Keep the Motorock ACF group in the main product editor column (not the sidebar).
 */
add_filter(
	'acf/load_field_group',
	function ( $field_group ) {
		if ( ! is_array( $field_group ) || ( $field_group['key'] ?? '' ) !== 'group_motorock_product' ) {
			return $field_group;
		}

		$field_group['position']   = 'normal';
		$field_group['menu_order'] = 10;

		return $field_group;
	}
);

add_action(
	'add_meta_boxes',
	function ( $post_type ) {
		if ( $post_type !== 'product' ) {
			return;
		}

		remove_meta_box( 'acf-group_motorock_product', 'product', 'side' );
	},
	99
);

/**
 * Sync ACF lifestyle gallery attachment IDs to a JSON URL list for headless GraphQL.
 */
function motorock_sync_lifestyle_gallery_meta( $post_id ) {
	if ( get_post_type( $post_id ) !== 'product' ) {
		return;
	}

	if ( ! function_exists( 'get_field' ) ) {
		return;
	}

	$attachment_ids = get_field( MOTOROCK_LIFESTYLE_GALLERY_ACF, $post_id );

	if ( ! is_array( $attachment_ids ) || count( $attachment_ids ) === 0 ) {
		delete_post_meta( $post_id, MOTOROCK_LIFESTYLE_GALLERY_META );
		return;
	}

	$urls = array();

	foreach ( $attachment_ids as $attachment_id ) {
		$url = wp_get_attachment_image_url( (int) $attachment_id, 'full' );

		if ( $url ) {
			$urls[] = $url;
		}
	}

	if ( count( $urls ) === 0 ) {
		delete_post_meta( $post_id, MOTOROCK_LIFESTYLE_GALLERY_META );
		return;
	}

	update_post_meta(
		$post_id,
		MOTOROCK_LIFESTYLE_GALLERY_META,
		wp_json_encode(
			array_values( $urls ),
			JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
		)
	);
}

add_action( 'acf/save_post', 'motorock_sync_lifestyle_gallery_meta', 20 );

/**
 * Product video URL — pick uploaded videos from the Media Library.
 */
add_action(
	'acf/render_field/key=field_motorock_product_video_url',
	function ( $field ) {
		?>
		<div class="motorock-product-video-picker">
			<p class="motorock-product-video-preview description" style="display:none;margin:0 0 4px;width:100%;"></p>
			<button type="button" class="button motorock-select-product-video">
				<?php esc_html_e( 'Vali video meediateegist', 'motorock' ); ?>
			</button>
			<button type="button" class="button-link motorock-clear-product-video" style="display:none;">
				<?php esc_html_e( 'Eemalda video', 'motorock' ); ?>
			</button>
		</div>
		<?php
	},
	20
);

add_action(
	'acf/input/admin_enqueue_scripts',
	function () {
		wp_enqueue_media();

		wp_register_script(
			'motorock-product-video-picker',
			false,
			array( 'acf-input', 'media-editor' ),
			'1.2.4',
			true
		);
		wp_enqueue_script( 'motorock-product-video-picker' );

		wp_register_style(
			'motorock-product-video-picker',
			false,
			array(),
			'1.2.4'
		);
		wp_enqueue_style( 'motorock-product-video-picker' );

		wp_add_inline_style(
			'motorock-product-video-picker',
			'.motorock-product-video-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }'
		);

		wp_add_inline_script(
			'motorock-product-video-picker',
			<<<'JS'
(function ($) {
  if (typeof acf === 'undefined') {
    return;
  }

  function attachmentUrl(attachment) {
    return attachment.url || attachment.source_url || attachment.link || '';
  }

  function updatePreview($fieldEl, url) {
    var $picker = $fieldEl.find('.motorock-product-video-picker');
    var $preview = $picker.find('.motorock-product-video-preview');
    var $clear = $picker.find('.motorock-clear-product-video');
    var value = $.trim(url || '');

    if (!value) {
      $preview.text('').hide();
      $clear.hide();
      return;
    }

    var name = value.split('/').pop() || value;
    try {
      name = decodeURIComponent(name);
    } catch (error) {
      // Keep encoded filename when decode fails.
    }

    $preview.text('Valitud: ' + name).show();
    $clear.show();
  }

  function setFieldVideoUrl(field, url) {
    field.val(url);

    if (typeof field.render === 'function') {
      field.render();
    }

    field.$input().trigger('input').trigger('change');
    updatePreview(field.$el, url);
  }

  acf.addAction('ready_field/key=field_motorock_product_video_url', function (field) {
    updatePreview(field.$el, field.val());

    field.$el.find('.motorock-select-product-video').on('click', function (event) {
      event.preventDefault();

      var frame = wp.media({
        title: 'Vali toote video',
        button: { text: 'Kasuta seda videot' },
        library: { type: 'video' },
        multiple: false,
      });

      frame.on('select', function () {
        var attachment = frame.state().get('selection').first().toJSON();
        var url = attachmentUrl(attachment);

        if (url) {
          setFieldVideoUrl(field, url);
        }
      });

      frame.open();
    });

    field.$el.find('.motorock-clear-product-video').on('click', function (event) {
      event.preventDefault();
      setFieldVideoUrl(field, '');
    });
  });
})(jQuery);
JS
		);
	}
);
