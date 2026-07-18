import { Component, PLATFORM_ID, computed, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';

/** A single line series rendered by {@link LineChartComponent}. */
export type LineChartDataset = {
  /** Legend label for the series. */
  label: string;
  /** Y-values, one per x-axis label. */
  data: number[];
  /** Optional PrimeNG CSS variable name for the line color (e.g. '--p-primary-500'). */
  colorVar?: string;
};

/**
 * Thin, reusable wrapper around PrimeNG's line chart. Takes plain labels/datasets inputs and
 * derives the Chart.js data and options, pulling colors from the active PrimeNG theme so the
 * chart follows light/dark mode. Rendering is guarded to the browser for SSR safety.
 */
@Component({
  selector: 'jhi-line-chart',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './line-chart.component.html',
})
export class LineChartComponent {
  /** X-axis labels shared by every dataset. */
  labels = input.required<string[]>();

  /** One or more line series to plot. */
  datasets = input.required<LineChartDataset[]>();

  /** Container height in pixels. */
  heightPx = input<number>(360);

  /**
   * Upper bound of the y-axis. When omitted, it is rounded up from the largest data point to the
   * next "nice" value so the highest line always sits comfortably below the top of the chart.
   */
  yMax = input<number | undefined>(undefined);

  /** Chart.js data object built from the component inputs and the current theme colors. */
  readonly data = computed(() => {
    const style = this.themeStyle();
    const fallbackColorVars = ['--p-primary-500', '--p-cyan-500', '--p-orange-500', '--p-gray-500'];
    return {
      labels: this.labels(),
      datasets: this.datasets().map((dataset, index) => {
        const color = this.readCssColor(style, dataset.colorVar ?? fallbackColorVars[index % fallbackColorVars.length]);
        return {
          label: dataset.label,
          data: dataset.data,
          fill: false,
          borderColor: color,
          backgroundColor: color,
          tension: 0.4,
        };
      }),
    };
  });

  /** Chart.js options themed from the current CSS variables. */
  readonly options = computed(() => {
    const style = this.themeStyle();
    return {
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: this.readCssColor(style, '--p-text-color') } },
      },
      scales: {
        x: {
          ticks: { color: this.readCssColor(style, '--p-text-muted-color') },
          grid: { color: this.readCssColor(style, '--p-content-border-color') },
        },
        y: {
          beginAtZero: true,
          max: this.yMax() ?? this.niceCeil(this.maxDataValue()),
          ticks: { color: this.readCssColor(style, '--p-text-muted-color'), precision: 0 },
          grid: { color: this.readCssColor(style, '--p-content-border-color') },
        },
      },
    };
  });

  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Root element style in the browser, or undefined during server-side rendering. */
  private themeStyle(): CSSStyleDeclaration | undefined {
    return this.isBrowser ? getComputedStyle(document.documentElement) : undefined;
  }

  /** Reads a CSS custom property, returning undefined when unset so Chart.js falls back to its defaults. */
  private readCssColor(style: CSSStyleDeclaration | undefined, cssVar: string): string | undefined {
    const value = style?.getPropertyValue(cssVar).trim();
    return value !== undefined && value !== '' ? value : undefined;
  }

  /** The largest value across all datasets, or 0 when there is no data. */
  private maxDataValue(): number {
    return this.datasets().reduce((max, dataset) => Math.max(max, ...dataset.data, 0), 0);
  }

  /**
   * Rounds a value up to the next visually pleasant axis maximum (e.g. 30 → 50, 57 → 75), always
   * leaving headroom above the data and keeping the maximum an integer.
   *
   * @param value the largest data value to accommodate
   * @returns a rounded-up axis maximum
   */
  private niceCeil(value: number): number {
    if (value <= 0) {
      return 5;
    }
    const steps = [1, 2, 2.5, 5, 7.5, 10];
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const ratio = value / magnitude;
    const niceRatio = steps.find(step => step > ratio) ?? 10;
    return Math.ceil(niceRatio * magnitude);
  }
}
