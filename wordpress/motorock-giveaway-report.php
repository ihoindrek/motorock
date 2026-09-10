<?php
/**
 * Plugin Name: Motorock Giveaway Report
 * Description: Live admin dashboard for MotoRock Giveaway 2026 draw entries.
 * Version: 1.1.0
 *
 * Install: copy motorock-giveaway-report.php + motorock-giveaway-report-lib.php
 *          to wp-content/mu-plugins/
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/motorock-giveaway-report-lib.php';

final class Motorock_Giveaway_Report_Admin {

	const PAGE_SLUG = 'motorock-giveaway-report';

	public static function register(): void {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'maybe_output_export' ) );
	}

	public static function register_menu(): void {
		add_submenu_page(
			'woocommerce',
			__( 'Giveaway 2026', 'motorock-giveaway-report' ),
			__( 'Giveaway 2026', 'motorock-giveaway-report' ),
			'manage_woocommerce',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' )
		);
	}

	public static function maybe_output_export(): void {
		if ( ! is_admin() || ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}

		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		$fmt  = isset( $_GET['format'] ) ? sanitize_key( wp_unslash( $_GET['format'] ) ) : '';

		if ( $page !== self::PAGE_SLUG || $fmt === '' ) {
			return;
		}

		$report = motorock_giveaway_build_report();

		if ( $fmt === 'json' ) {
			nocache_headers();
			header( 'Content-Type: application/json; charset=utf-8' );
			echo wp_json_encode( $report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
			exit;
		}

		if ( $fmt !== 'csv' ) {
			return;
		}

		$type = isset( $_GET['type'] ) ? sanitize_key( wp_unslash( $_GET['type'] ) ) : 'participants';

		if ( $type === 'print' ) {
			$rows     = $report['print_tickets'];
			$filename = 'giveaway-2026-print-tickets.csv';
		} else {
			$rows = array();
			foreach ( $report['participants'] as $participant ) {
				$rows[] = array(
					'customer_name' => $participant['customer_name'] ?? '',
					'email'         => $participant['email'] ?? '',
					'tickets'       => (int) ( $participant['tickets'] ?? 0 ),
					'orders_count'  => (int) ( $participant['orders_count'] ?? 0 ),
					'order_ids'     => implode( ',', array_map( 'strval', $participant['order_ids'] ?? array() ) ),
				);
			}
			$filename = 'giveaway-2026-participants.csv';
		}

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		echo "\xEF\xBB\xBF";
		echo motorock_giveaway_rows_to_csv( $rows );
		exit;
	}

	public static function render_page(): void {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'Insufficient permissions.', 'motorock-giveaway-report' ) );
		}

		$report     = motorock_giveaway_build_report();
		$last7      = $report['last_7_days'];
		$json_url          = add_query_arg(
			array(
				'page'   => self::PAGE_SLUG,
				'format' => 'json',
			),
			admin_url( 'admin.php' )
		);
		$csv_participants_url = add_query_arg(
			array(
				'page'   => self::PAGE_SLUG,
				'format' => 'csv',
				'type'   => 'participants',
			),
			admin_url( 'admin.php' )
		);
		$csv_print_url     = add_query_arg(
			array(
				'page'   => self::PAGE_SLUG,
				'format' => 'csv',
				'type'   => 'print',
			),
			admin_url( 'admin.php' )
		);
		$max_daily  = max( 1, ...array_values( $last7['daily_tickets'] ) );
		$ticket_delta = (int) $last7['tickets_delta'];
		?>
		<div class="wrap motorock-giveaway-report">
			<h1><?php esc_html_e( 'MotoRock Giveaway 2026', 'motorock-giveaway-report' ); ?></h1>
			<p class="description">
				<?php
				printf(
					/* translators: 1: campaign period, 2: days until draw */
					esc_html__( 'Period: %1$s · Draw in %2$d days · Rule: every €100 of equipment = 1 entry (motorcycles excluded)', 'motorock-giveaway-report' ),
					esc_html( (string) $report['period'] ),
					(int) $report['days_until_draw']
				);
				?>
			</p>
			<p>
				<a href="<?php echo esc_url( $csv_participants_url ); ?>" class="button button-primary">
					<?php esc_html_e( 'Export CSV — participants', 'motorock-giveaway-report' ); ?>
				</a>
				<a href="<?php echo esc_url( $csv_print_url ); ?>" class="button button-secondary">
					<?php esc_html_e( 'Export CSV — one row per ticket', 'motorock-giveaway-report' ); ?>
				</a>
				<a href="<?php echo esc_url( $json_url ); ?>" class="button button-secondary" target="_blank" rel="noopener noreferrer">
					<?php esc_html_e( 'Export JSON', 'motorock-giveaway-report' ); ?>
				</a>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . self::PAGE_SLUG ) ); ?>" class="button button-secondary">
					<?php esc_html_e( 'Refresh', 'motorock-giveaway-report' ); ?>
				</a>
				<span class="description" style="margin-left:8px;">
					<?php
					printf(
						/* translators: %s: ISO timestamp */
						esc_html__( 'Updated %s', 'motorock-giveaway-report' ),
						esc_html( (string) $report['generated_at'] )
					);
					?>
				</span>
			</p>

			<style>
				.motorock-giveaway-report .mrg-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
					gap: 16px;
					margin: 24px 0;
				}
				.motorock-giveaway-report .mrg-card {
					background: #fff;
					border: 1px solid #c3c4c7;
					border-radius: 4px;
					padding: 16px 18px;
					box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
				}
				.motorock-giveaway-report .mrg-card-label {
					font-size: 12px;
					text-transform: uppercase;
					letter-spacing: 0.04em;
					color: #646970;
					margin: 0 0 8px;
				}
				.motorock-giveaway-report .mrg-card-value {
					font-size: 32px;
					line-height: 1.1;
					font-weight: 700;
					margin: 0;
					color: #1d2327;
				}
				.motorock-giveaway-report .mrg-card-sub {
					margin: 8px 0 0;
					font-size: 13px;
					color: #50575e;
				}
				.motorock-giveaway-report .mrg-delta-up { color: #008a20; font-weight: 600; }
				.motorock-giveaway-report .mrg-delta-down { color: #b32d2e; font-weight: 600; }
				.motorock-giveaway-report .mrg-delta-flat { color: #646970; font-weight: 600; }
				.motorock-giveaway-report .mrg-bars {
					display: grid;
					grid-template-columns: repeat(7, minmax(0, 1fr));
					gap: 10px;
					align-items: end;
					min-height: 140px;
					margin-top: 12px;
				}
				.motorock-giveaway-report .mrg-bar-col { text-align: center; }
				.motorock-giveaway-report .mrg-bar {
					background: linear-gradient(180deg, #ff6813 0%, #e85a0a 100%);
					border-radius: 3px 3px 0 0;
					min-height: 4px;
					margin: 0 auto 6px;
					width: 100%;
					max-width: 48px;
				}
				.motorock-giveaway-report .mrg-bar-count {
					font-size: 12px;
					font-weight: 600;
					color: #1d2327;
				}
				.motorock-giveaway-report .mrg-bar-day {
					font-size: 11px;
					color: #646970;
				}
				.motorock-giveaway-report .mrg-section { margin-top: 28px; }
				.motorock-giveaway-report .mrg-roster-table { margin-top: 12px; }
			</style>

			<div class="mrg-grid">
				<div class="mrg-card">
					<p class="mrg-card-label"><?php esc_html_e( 'Total tickets', 'motorock-giveaway-report' ); ?></p>
					<p class="mrg-card-value"><?php echo esc_html( number_format_i18n( (int) $report['total_tickets'] ) ); ?></p>
				</div>
				<div class="mrg-card">
					<p class="mrg-card-label"><?php esc_html_e( 'Unique participants', 'motorock-giveaway-report' ); ?></p>
					<p class="mrg-card-value"><?php echo esc_html( number_format_i18n( (int) $report['unique_participants'] ) ); ?></p>
					<p class="mrg-card-sub">
						<?php
						printf(
							/* translators: %d: new participants in last 7 days */
							esc_html__( '+%d new in last 7 days', 'motorock-giveaway-report' ),
							(int) $last7['new_participants']
						);
						?>
					</p>
				</div>
				<div class="mrg-card">
					<p class="mrg-card-label"><?php esc_html_e( 'Eligible orders', 'motorock-giveaway-report' ); ?></p>
					<p class="mrg-card-value"><?php echo esc_html( number_format_i18n( (int) $report['eligible_orders'] ) ); ?></p>
					<p class="mrg-card-sub">
						<?php
						echo wp_kses_post( self::format_price( (float) $report['equipment_revenue_eligible'] ) );
						echo ' ';
						esc_html_e( 'equipment subtotal', 'motorock-giveaway-report' );
						?>
					</p>
				</div>
				<div class="mrg-card">
					<p class="mrg-card-label"><?php esc_html_e( 'Last 7 days', 'motorock-giveaway-report' ); ?></p>
					<p class="mrg-card-value"><?php echo esc_html( number_format_i18n( (int) $last7['tickets'] ) ); ?></p>
					<p class="mrg-card-sub">
						<?php esc_html_e( 'tickets', 'motorock-giveaway-report' ); ?>
						<span class="<?php echo esc_attr( self::delta_class( $ticket_delta ) ); ?>">
							<?php echo esc_html( self::format_delta( $ticket_delta ) ); ?>
						</span>
						<?php esc_html_e( 'vs previous 7 days', 'motorock-giveaway-report' ); ?>
					</p>
				</div>
			</div>

			<div class="mrg-section">
				<h2><?php esc_html_e( 'Full participant roster (for printing)', 'motorock-giveaway-report' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Aggregated by customer email. Multiple orders from the same person are combined into one ticket total.', 'motorock-giveaway-report' ); ?>
				</p>
				<?php self::render_participants_table( $report['participants'] ); ?>
			</div>

			<div class="mrg-card mrg-section">
				<h2 style="margin-top:0;"><?php esc_html_e( 'Tickets per day (last 7 days)', 'motorock-giveaway-report' ); ?></h2>
				<div class="mrg-bars" aria-hidden="true">
					<?php foreach ( $last7['daily_tickets'] as $day => $count ) : ?>
						<div class="mrg-bar-col">
							<div
								class="mrg-bar"
								style="height: <?php echo esc_attr( (string) max( 4, (int) round( ( $count / $max_daily ) * 110 ) ) ); ?>px;"
							></div>
							<div class="mrg-bar-count"><?php echo esc_html( (string) $count ); ?></div>
							<div class="mrg-bar-day"><?php echo esc_html( gmdate( 'd M', strtotime( $day ) ) ); ?></div>
						</div>
					<?php endforeach; ?>
				</div>
			</div>

			<div class="mrg-section">
				<h2><?php esc_html_e( 'Top orders by tickets', 'motorock-giveaway-report' ); ?></h2>
				<?php self::render_orders_table( $report['top_orders'], true ); ?>
			</div>

			<?php if ( ! empty( $report['recent_orders'] ) ) : ?>
				<div class="mrg-section">
					<h2><?php esc_html_e( 'Recent eligible orders (last 7 days)', 'motorock-giveaway-report' ); ?></h2>
					<?php self::render_orders_table( $report['recent_orders'], false ); ?>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * @param array<int, array<string, mixed>> $rows
	 */
	private static function render_participants_table( array $rows ): void {
		if ( $rows === array() ) {
			echo '<p>' . esc_html__( 'No participants yet.', 'motorock-giveaway-report' ) . '</p>';
			return;
		}
		?>
		<table class="widefat striped mrg-roster-table">
			<thead>
				<tr>
					<th><?php esc_html_e( '#', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Customer', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Email', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Tickets', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Orders', 'motorock-giveaway-report' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $rows as $index => $row ) : ?>
					<tr>
						<td><?php echo esc_html( (string) ( $index + 1 ) ); ?></td>
						<td><strong><?php echo esc_html( (string) ( $row['customer_name'] ?? '—' ) ); ?></strong></td>
						<td><?php echo esc_html( (string) ( $row['email'] ?? '—' ) ); ?></td>
						<td><strong><?php echo esc_html( (string) (int) ( $row['tickets'] ?? 0 ) ); ?></strong></td>
						<td><?php echo esc_html( (string) (int) ( $row['orders_count'] ?? 0 ) ); ?></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		<?php
	}

	/**
	 * @param array<int, array<string, mixed>> $rows
	 */
	private static function render_orders_table( array $rows, bool $link_orders ): void {
		if ( $rows === array() ) {
			echo '<p>' . esc_html__( 'No eligible orders yet.', 'motorock-giveaway-report' ) . '</p>';
			return;
		}
		?>
		<table class="widefat striped">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Order', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Customer', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Date', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Eligible €', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Tickets', 'motorock-giveaway-report' ); ?></th>
					<th><?php esc_html_e( 'Status', 'motorock-giveaway-report' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $rows as $row ) : ?>
					<tr>
						<td>
							<?php if ( $link_orders ) : ?>
								<a href="<?php echo esc_url( admin_url( 'post.php?post=' . (int) $row['order_id'] . '&action=edit' ) ); ?>">
									#<?php echo esc_html( (string) $row['order_id'] ); ?>
								</a>
							<?php else : ?>
								#<?php echo esc_html( (string) $row['order_id'] ); ?>
							<?php endif; ?>
						</td>
						<td><?php echo esc_html( (string) ( $row['customer_name'] ?? '—' ) ); ?></td>
						<td><?php echo esc_html( (string) $row['date'] ); ?></td>
						<td><?php echo wp_kses_post( self::format_price( (float) $row['eligible_eur'] ) ); ?></td>
						<td><strong><?php echo esc_html( (string) $row['tickets'] ); ?></strong></td>
						<td><?php echo esc_html( (string) $row['status'] ); ?></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		<?php
	}

	private static function format_price( float $amount ): string {
		if ( function_exists( 'wc_price' ) ) {
			return wc_price( $amount );
		}

		return number_format( $amount, 2, '.', '' ) . ' EUR';
	}

	private static function format_delta( int $delta ): string {
		if ( $delta > 0 ) {
			return '+' . number_format_i18n( $delta );
		}

		return number_format_i18n( $delta );
	}

	private static function delta_class( int $delta ): string {
		if ( $delta > 0 ) {
			return 'mrg-delta-up';
		}

		if ( $delta < 0 ) {
			return 'mrg-delta-down';
		}

		return 'mrg-delta-flat';
	}
}

Motorock_Giveaway_Report_Admin::register();
