interface ImportMeta {
  readonly glob: <T = unknown>(
    pattern: string,
    options?: {
      readonly query?: string
      readonly import?: string
      readonly eager?: boolean
    },
  ) => Record<string, T>
}
