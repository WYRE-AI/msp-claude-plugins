declare module 'claude-code' {
  interface PluginState {
    // The tech's active client for this session. Never carried over from an
    // earlier session: an explicit `/client <name>` is the only way to set it.
    'wyre-gateway': { client: string | null }
  }
}
