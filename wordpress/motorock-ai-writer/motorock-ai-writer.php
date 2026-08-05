<?php
/**
 * Motorock AI Writer — module bootstrap.
 * Loaded by Motorock Commerce AI Engine; do not require this file directly on production.
 */

defined( 'ABSPATH' ) || exit;

if ( defined( 'MOTOROCK_COMMERCE_AI_LOADED' ) ) {
	return;
}

require_once dirname( __DIR__ ) . '/motorock-commerce-ai/motorock-commerce-ai.php';
