<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Menu {

	const MENU_SLUG  = 'motorock-commerce-ai';
	const MENU_ORDER = 56;

	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ), 9 );
		add_action( 'admin_menu', array( __CLASS__, 'register_submenus' ), 10 );
		add_action( 'admin_menu', array( __CLASS__, 'remove_legacy_submenus' ), 999 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function menu_slug() {
		return self::MENU_SLUG;
	}

	public static function page_hook( $page_slug ) {
		if ( $page_slug === self::MENU_SLUG ) {
			return 'toplevel_page_' . self::MENU_SLUG;
		}

		return self::MENU_SLUG . '_page_' . $page_slug;
	}

	public static function register_menu() {
		add_menu_page(
			__( 'Commerce AI', 'motorock-commerce-ai' ),
			__( 'Commerce AI', 'motorock-commerce-ai' ),
			'edit_products',
			self::MENU_SLUG,
			array( 'Motorock_Commerce_Ai_Admin_Dashboard', 'render_page' ),
			'dashicons-superhero-alt',
			self::MENU_ORDER
		);
	}

	public static function register_submenus() {
		add_submenu_page(
			self::MENU_SLUG,
			__( 'Dashboard', 'motorock-commerce-ai' ),
			__( 'Dashboard', 'motorock-commerce-ai' ),
			'edit_products',
			self::MENU_SLUG,
			array( 'Motorock_Commerce_Ai_Admin_Dashboard', 'render_page' )
		);

		if ( class_exists( 'Motorock_Ai_Admin_Bulk' ) ) {
			add_submenu_page(
				self::MENU_SLUG,
				__( 'Product content', 'motorock-commerce-ai' ),
				__( 'Product content', 'motorock-commerce-ai' ),
				'edit_products',
				'motorock-ai-bulk',
				array( 'Motorock_Ai_Admin_Bulk', 'render_page' )
			);
		}

		if ( class_exists( 'Motorock_Commerce_Ai_Admin_Blog' ) ) {
			add_submenu_page(
				self::MENU_SLUG,
				__( 'Blog generator', 'motorock-commerce-ai' ),
				__( 'Blog generator', 'motorock-commerce-ai' ),
				'edit_products',
				Motorock_Commerce_Ai_Admin_Blog::PAGE_SLUG,
				array( 'Motorock_Commerce_Ai_Admin_Blog', 'render_page' )
			);
		}

		if ( class_exists( 'Motorock_Commerce_Ai_Admin_Related_Products' ) ) {
			add_submenu_page(
				self::MENU_SLUG,
				__( 'Related products', 'motorock-commerce-ai' ),
				__( 'Related products', 'motorock-commerce-ai' ),
				'edit_products',
				Motorock_Commerce_Ai_Admin_Related_Products::PAGE_SLUG,
				array( 'Motorock_Commerce_Ai_Admin_Related_Products', 'render_page' )
			);
		}

		if ( class_exists( 'Motorock_Commerce_Ai_Admin_Seo_Audit' ) ) {
			add_submenu_page(
				self::MENU_SLUG,
				__( 'SEO audit', 'motorock-commerce-ai' ),
				__( 'SEO audit', 'motorock-commerce-ai' ),
				'edit_products',
				Motorock_Commerce_Ai_Admin_Seo_Audit::PAGE_SLUG,
				array( 'Motorock_Commerce_Ai_Admin_Seo_Audit', 'render_page' )
			);
		}
	}

	public static function remove_legacy_submenus() {
		remove_submenu_page( 'edit.php?post_type=product', 'motorock-commerce-ai' );
		remove_submenu_page( 'edit.php?post_type=product', 'motorock-commerce-ai-blog' );
		remove_submenu_page( 'edit.php?post_type=product', 'motorock-commerce-ai-seo-audit' );
		remove_submenu_page( 'edit.php?post_type=product', 'motorock-commerce-ai-related' );
		remove_submenu_page( 'edit.php?post_type=product', 'motorock-ai-bulk' );
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( ! self::is_commerce_ai_screen( $hook_suffix ) ) {
			return;
		}

		wp_enqueue_style(
			'motorock-commerce-ai-admin-menu',
			plugins_url( '../assets/admin-menu.css', __FILE__ ),
			array(),
			MOTOROCK_COMMERCE_AI_VERSION
		);
	}

	private static function is_commerce_ai_screen( $hook_suffix ) {
		if ( ! is_string( $hook_suffix ) || $hook_suffix === '' ) {
			return false;
		}

		if ( $hook_suffix === self::page_hook( self::MENU_SLUG ) ) {
			return true;
		}

		return str_starts_with( $hook_suffix, self::MENU_SLUG . '_page_' );
	}
}
