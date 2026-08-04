<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Logger {

	public static function info( $message, $context = array() ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[motorock-ai] ' . $message . ( $context ? ' ' . wp_json_encode( $context ) : '' ) );
		}
	}
}
