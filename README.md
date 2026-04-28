# Sampler

A browser-based drum sampler built with React and the Web Audio API. Eight pads mapped to keyboard keys, each with its own sample editor.

**[Live demo →](https://tgstern.github.io/sampler/)**

## Features

- **8 sample pads** mapped to keys `A S D F G H J K`
- **Sample editor** per pad — pitch transpose, filter (LP/BP/HP), volume, pan, reverse, waveform start/stop
- **Add samples** - click the plus button to upload custom samples
- **Sample picker** — click the sample name in the editor to choose any sample from the active pack (preloaded with TR-808 pack)
- **Randomize** — ↺ button replaces a pad with an unused sample from the current pack; pack menu randomizes all 8
- **Keyboard navigation** — `↑` opens/closes the editor for the last-played pad; `← →` step through pads while editor is open

## Development

Requires Node 20+.

```bash
npm install
npm run dev
```

### Adding sample packs

Drop a folder of `.wav` files into `src/assets/`. It will appear automatically in the pack menu on the next build — no code changes needed.

## Deployment

Releases are manual. Bump the version in `package.json`, then:

```bash
npm run deploy
```

This triggers the [GitHub Actions release workflow](.github/workflows/release.yml), which builds the app, deploys to GitHub Pages, and creates a GitHub Release with auto-generated notes.

Requires the [GitHub CLI](https://cli.github.com/) (`gh`) to be installed and authenticated. Install with `brew install gh`.
