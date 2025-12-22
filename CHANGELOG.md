# Changelog

## [0.6.1](https://github.com/boneskull/claude-plugins/compare/claude-plugins-v0.6.0...claude-plugins-v0.6.1) (2025-12-22)


### Bug Fixes

* **skill-activation:** support the new plugin schema ([853a993](https://github.com/boneskull/claude-plugins/commit/853a99317845d67a047380dda5ce984d30e735c4))
* **tools:** fix finish-worktree command ([4d1857b](https://github.com/boneskull/claude-plugins/commit/4d1857b4a184bf49e8949e1d86d41fdd8d16ebd6))

## [0.6.0](https://github.com/boneskull/claude-plugins/compare/claude-plugins-v0.5.0...claude-plugins-v0.6.0) (2025-12-16)


### Features

* **xstate:** add a skill-rules.json ([f486eb4](https://github.com/boneskull/claude-plugins/commit/f486eb420c624388451a5e2bf57003a2e67b5db9))

## [0.5.0](https://github.com/boneskull/claude-plugins/compare/claude-plugins-v0.4.0...claude-plugins-v0.5.0) (2025-11-23)


### Features

* **bupkis:** add /bupkis convenience command ([d63552c](https://github.com/boneskull/claude-plugins/commit/d63552c7a4eb367c917acc4c19a533e08b40d0a8))
* **plugins:** add new xstate plugin ([f23123e](https://github.com/boneskull/claude-plugins/commit/f23123eae27f4e0b8530a5140e979954b0098eba))
* **plugins:** add skill activation rules to tools, bupkis, and zod plugins ([f34deac](https://github.com/boneskull/claude-plugins/commit/f34deac73f3059f24ca86c155aea3f715893327b))
* **skill-activation:** add centralized skill activation plugin ([6962e95](https://github.com/boneskull/claude-plugins/commit/6962e9549d2f751b933bd6b56a74aa3497490b90))
* **xstate:** add /xstate and /audition convenience commands ([e38bec2](https://github.com/boneskull/claude-plugins/commit/e38bec280b6eab9d8551644af372b63917a1c3d2))
* **zod:** add /zod convenience command ([c0f974b](https://github.com/boneskull/claude-plugins/commit/c0f974bb6a0df9f4315127cd2000e529a8c86911))


### Bug Fixes

* **skill-activation:** display skill activation status directly to user ([8b2c290](https://github.com/boneskull/claude-plugins/commit/8b2c2903c3df2dfca536ad7a0d7a2aa4b4f46afa))

## [0.4.0](https://github.com/boneskull/claude-plugins/compare/claude-plugins-v0.3.0...claude-plugins-v0.4.0) (2025-11-20)


### Features

* **tools:** add finish-worktree command ([71a9612](https://github.com/boneskull/claude-plugins/commit/71a9612755f478a60fa88d7f091f50c8bc61bfba))
* **tools:** add worktree deletion with untracked file handling ([fbbf991](https://github.com/boneskull/claude-plugins/commit/fbbf9914eba4d15db23e05ebd04950023b82e02a))
* **zod:** add Zod v4 validation guidance plugin ([af965a7](https://github.com/boneskull/claude-plugins/commit/af965a7e79319b4e43c4579203ee81d33bad3d2e))


### Bug Fixes

* **refactor:** use recommended agent format ([a510fe4](https://github.com/boneskull/claude-plugins/commit/a510fe4a475ac2bd68560878741010753704064e))
* **tools:** add rebase-in-progress detection to finish-worktree ([a04b6ea](https://github.com/boneskull/claude-plugins/commit/a04b6ea4536e73cf3252a9b69f70bca7f63f32d2))
* **tools:** fix order of operations in finish-worktree command ([83eff34](https://github.com/boneskull/claude-plugins/commit/83eff343bfdb94ac60e04a036398ce39aa5e59b7))

## [0.3.0](https://github.com/boneskull/claude-plugins/compare/claude-plugins-v0.2.1...claude-plugins-v0.3.0) (2025-11-19)


### Features

* **tools:** add apply-template command ([8b5ce8a](https://github.com/boneskull/claude-plugins/commit/8b5ce8afbb7a6835359d9ed5cef9eab7a66a811e))


### Bug Fixes

* **tools:** enhance the apply-template tool ([16ea414](https://github.com/boneskull/claude-plugins/commit/16ea4148c57f004c5308cc8c84e0ab4ccdf2e1ed))

## [0.2.1](https://github.com/boneskull/claude-plugins/compare/claude-plugins-v0.2.0...claude-plugins-v0.2.1) (2025-11-18)


### Bug Fixes

* **tools:** fix the eslint fix hook ([d0229af](https://github.com/boneskull/claude-plugins/commit/d0229af6f0ea2898bcb8b744b498344db6a4a66f))

## [0.2.0](https://github.com/boneskull/claude-plugins/compare/claude-plugins-v0.1.0...claude-plugins-v0.2.0) (2025-11-18)


### Features

* **github:** add github plugin ([0344d1f](https://github.com/boneskull/claude-plugins/commit/0344d1f75ac8717c50aa9aa94123562df488afc7))
* **refactor:** add /simplify convenience command ([e45d209](https://github.com/boneskull/claude-plugins/commit/e45d2097fc3704d31ded4429bdbdca5f41219756))
* **refactor:** add code-simplifier agent ([0d37dc2](https://github.com/boneskull/claude-plugins/commit/0d37dc2421c3c1bd099f00b10deb864829fc87ce))
* **refactor:** add plugin metadata ([fdfe92c](https://github.com/boneskull/claude-plugins/commit/fdfe92c79369c5c424b550b78fdf8de0d97cbd78))
* **refactor:** create plugin directory structure ([ef2917a](https://github.com/boneskull/claude-plugins/commit/ef2917a54da686f0be1b3bbde5e4005f84cdbab0))
* **refactor:** register plugin in marketplace ([7957cd1](https://github.com/boneskull/claude-plugins/commit/7957cd1c7c7ac8d623df35f7220454d21a754ee9))
* **tools:** add error formatting and reporting to eslint-fix ([8de6859](https://github.com/boneskull/claude-plugins/commit/8de68592348760b2e6a743c4d733395ee121152b))
* **tools:** add eslint availability check with silent skip ([780e675](https://github.com/boneskull/claude-plugins/commit/780e67593b18212d457dce3b60b277f9ebf3fdde))
* **tools:** add eslint-fix script skeleton ([362cd43](https://github.com/boneskull/claude-plugins/commit/362cd439d30d8043096b71df35ee771ca3cb373a))
* **tools:** add file extension filtering to eslint-fix ([d51375f](https://github.com/boneskull/claude-plugins/commit/d51375fe9c558d3ea567933ff1ee2af0a4703243))
* **tools:** add git-commit-messages skill ([4a4f1c9](https://github.com/boneskull/claude-plugins/commit/4a4f1c9ad7cc9f750c80c11d3ea0026f0331e035))
* **tools:** add git-directory-management skill and remove .gitkeep ([ebd4144](https://github.com/boneskull/claude-plugins/commit/ebd4144111085b5569b0483c9092e08daeba4ebd))
* **tools:** add hooks directory structure ([f2de187](https://github.com/boneskull/claude-plugins/commit/f2de18715215764fae935ad5daab9c4355fccc62))
* **tools:** add PostToolUse hook configuration for eslint ([d6c6c2a](https://github.com/boneskull/claude-plugins/commit/d6c6c2a34e3fab91655d2348c9a4e06a1e5306a0))
* **tools:** implement eslint --fix execution with JSON parsing ([ac1145b](https://github.com/boneskull/claude-plugins/commit/ac1145b961a618df465c2709216c0185123916f8))


### Bug Fixes

* **docs:** add language specifiers to code blocks in README ([e490557](https://github.com/boneskull/claude-plugins/commit/e49055766345fa771abf3b32ffc013eed06fe0b1))
* **github:** add github plugin to marketplace ([f86c3f4](https://github.com/boneskull/claude-plugins/commit/f86c3f42ae203ed077ca2a5fa0635ebe2b0ff6af))
* **tools:** add error handling and case-insensitive matching to eslint-fix ([d5d2da4](https://github.com/boneskull/claude-plugins/commit/d5d2da4252c99182749fc71dea70aba6c1275f6d))

## 0.1.0 (2025-11-13)


### Features

* add bupkis plugin with assertion patterns skill ([2f227a3](https://github.com/boneskull/claude-plugins/commit/2f227a32d8f2ebd35c77aa2aa968eff5e6074de4))
* add example agent with restricted tools ([e006b47](https://github.com/boneskull/claude-plugins/commit/e006b47ab57df51c72f7cd5fd97a7520c18b04a3))
* add example commands (hello, analyze) ([72b6e5c](https://github.com/boneskull/claude-plugins/commit/72b6e5cad7575db0d3249355b32488d8e6e2dd33))
* add example hooks (SessionStart, PostToolUse) ([29b318c](https://github.com/boneskull/claude-plugins/commit/29b318cbddf3a971e3a6c575dfc253fe03119716))
* add example skill with progressive disclosure ([32e6389](https://github.com/boneskull/claude-plugins/commit/32e6389f66368a7a3822460ebdb508f4ecf49ee4))
* add marketplace configuration ([d98b409](https://github.com/boneskull/claude-plugins/commit/d98b409b27cacfed483eeee790bc95f7923bfe5c))
* add TypeScript MCP server implementation ([7df60fa](https://github.com/boneskull/claude-plugins/commit/7df60fa5336a31081e81adbde382dbd2e0fdd70b))
* create example plugin structure ([cf99154](https://github.com/boneskull/claude-plugins/commit/cf9915401bf84fe46300b06ebf52931cedb25eb0))
* **marketplace:** add tools plugin to catalog ([4f2e3dd](https://github.com/boneskull/claude-plugins/commit/4f2e3dda20660d00e0785775eec6c528e18d6cca))
* **tools:** add plugin metadata ([079b403](https://github.com/boneskull/claude-plugins/commit/079b403107ebca090e717d8702a7e9c365930f22))
* **tools:** create plugin directory structure ([8728760](https://github.com/boneskull/claude-plugins/commit/872876066ecfc6d04ac0accbdabfb0ccf2f3540c))
