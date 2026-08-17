<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Admin_Storefront_Config {

	public static function register() {
		add_action(
			'admin_enqueue_scripts',
			static function () {
				if ( ! current_user_can( 'edit_products' ) ) {
					return;
				}

				wp_register_script(
					'motorock-ai-storefront-client',
					content_url( 'mu-plugins/motorock-ai-writer/assets/admin-storefront-client.js' ),
					array(),
					defined( 'MOTOROCK_COMMERCE_AI_VERSION' ) ? MOTOROCK_COMMERCE_AI_VERSION : '0.5.6',
					true
				);
			},
			6
		);
	}

	public static function enqueue_for( $handle, $script_var = null, array $script_data = array() ) {
		if ( ! current_user_can( 'edit_products' ) ) {
			return;
		}

		wp_enqueue_script( 'motorock-ai-storefront-client' );

		$api_url    = self::get_api_url();
		$api_secret = self::get_api_secret();

		wp_localize_script(
			'motorock-ai-storefront-client',
			'MotorockAiStorefrontConfig',
			array(
				'apiUrl'    => $api_url,
				'apiSecret' => $api_secret ? $api_secret : '',
				'i18n'      => array(
					'notConfigured' => __(
						'AI API not configured on server (MOTOROCK_AI_API_SECRET).',
						'motorock-ai-writer'
					),
					'failed'        => __( 'Generation failed.', 'motorock-ai-writer' ),
					'networkFailed' => __( 'Could not reach the storefront AI API.', 'motorock-ai-writer' ),
				),
			)
		);

		wp_enqueue_script( $handle );

		if ( is_string( $script_var ) && $script_var !== '' && ! empty( $script_data ) ) {
			wp_localize_script( $handle, $script_var, $script_data );
		}
	}

	public static function get_api_url() {
		if ( defined( 'MOTOROCK_AI_API_URL' ) && MOTOROCK_AI_API_URL ) {
			return self::normalize_api_url( (string) MOTOROCK_AI_API_URL );
		}

		if ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
			return self::normalize_api_url( (string) MOTOROCK_STOREFRONT_URL );
		}

		$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
		return $env ? self::normalize_api_url( (string) $env ) : 'https://motorock.eu';
	}

	private static function normalize_api_url( $url ) {
		$url = rtrim( trim( $url ), '/' );

		if ( preg_match( '#^https://www\.#i', $url ) ) {
			$url = preg_replace( '#^https://www\.#i', 'https://', $url );
		}

		if ( preg_match( '#^https://shop\.motorock\.eu#i', $url ) ) {
			return 'https://motorock.eu';
		}

		return $url;
	}

	public static function get_api_secret() {
		if ( defined( 'MOTOROCK_AI_API_SECRET' ) && MOTOROCK_AI_API_SECRET ) {
			return (string) MOTOROCK_AI_API_SECRET;
		}

		$env = getenv( 'MOTOROCK_AI_API_SECRET' );
		return $env ? (string) $env : '';
	}
}
