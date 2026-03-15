# ddotz-hud

Enhanced statusline HUD for Claude Code.

## Layout

```
Opus 4.5 | ⎇ main (3) | ~/project
  default | 5h:45% wk:23% | 58.4% | $2.34 | 1hr 26m | agents:2 | bg:1/5
```

### Line 1
- **Model**: Current model name
- **Git**: Branch and changed file count
- **CWD**: Current working directory

### Line 2
- **Profile**: Current profile (default)
- **Rate Limits**: 5-hour and weekly usage (always shown)
- **Context**: Context window usage percentage
- **Cost**: Estimated session cost
- **Duration**: Session duration
- **Agents**: Running agent count (shown if > 0)
- **Background**: Background task count (shown if > 0)

## Installation

```bash
cd ~/Code/ddotz-hud
npm install
npm run build
```

## Configuration for Rate Limits (Optional)

To display API usage (5-hour and weekly rate limits), you must provide your Claude Session Key and Organization ID.
**Keep these keys private and do not upload them to any repository.**

Create a configuration file at `~/.claude/ddotz-hud-config.json` with your credentials:

```json
{
  "sessionKey": "sk-ant-...your-session-key-here...",
  "orgId": "your-organization-uuid-here"
}
```

*Alternatively, you can provide them as environment variables: `CLAUDE_SESSION_KEY` and `CLAUDE_ORG_ID`.*

## Usage

Update `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/Code/ddotz-hud/dist/index.js",
    "padding": 0
  }
}
```

Then restart Claude Code.

## Color Coding

| Color | Context | Rate Limit | Cost |
|-------|---------|------------|------|
| Green | < 70% | < 70% | < $2 |
| Yellow | 70-85% | 70-90% | $2-5 |
| Red | > 85% | > 90% | > $5 |

## Development

```bash
npm run dev   # Watch mode
npm run build # Production build
```

## License

MIT
