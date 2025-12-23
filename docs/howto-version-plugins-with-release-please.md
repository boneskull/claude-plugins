# How to Automate Claude Plugin Versioning with Release Please

## Introduction

Manually bumping the versions of your Claude Plugins is painful. If you have many plugins, it is _worse than death_. It's that bad.

By leveraging a tool that I've long used to version Node.js projects—[Release Please][]—we can make this process _at least_ no worse than a trip to the dentist.

What you'll get:

- Each plugin is _versioned independently_
- Each plugin gets its own _automatically-generated `CHANGELOG.md`_ file
- Each plugin gets its own _automatically-generated GitHub Release_

Incredible! Right?

> [!NOTE]
> This guide will not cover [Conventional Commits][] conventions; you're expected to be able to understand and use them yourself. It's not too hard!

### Prerequisites

- The strategy here assumes you have a "marketplace" repo with all of your plugins in it. The same strategy, however, can be applied to any plugin repo (with minimal changes). Some affordances have been made throughout the text for _you people_.
- You have one or more [Claude Plugins][claude plugin] you want to version.
- You are using [Conventional Commits][] or are ready to start now.
- You do not need dictatorial control over `CHANGELOG.md` entries.
- You are willing to use GitHub Actions.
- You are willing to allow GitHub Actions to create Pull Requests, labels, and branches.

### Architectural Overview

This section can be skipped if you just want to get started quickly, but gives a high-level overview of how this is done.

- Each plugin directory is considered a single "package" by Release Please.
- Release Please allows arbitrary updates to JSON files; we can use this to update `plugins/<name>/.claude-plugin/plugin.json` automatically.
- Release Please tracks the last-released version of each package through its manifest file (`.release-please-manifest.json`).
- The root `.claude-plugin/marketplace.json` only contains minimal metadata pointing to the relative paths of the plugins.
- The GitHub Actions workflow will run Release Please on every push to the `main` branch:
  - It will look at the commits and paths and determine which packages (plugins) have been affected and what the associated version bump should be (if any).
  - If it determines that a version bump is needed, it will create a (single) Pull Request with the changes needed for the Releases, including the version bump and the `CHANGELOG.md` entries.
  - Once the Pull Request is merged, Release Please will detect this and create the tag and GitHub Release(s) for you.

> [!NOTE]
>
> [Release Please][] does not care about your commit message scopes (the stuff in parentheses). They can contain whatever it is you desire. Releases are determined based on the paths of the changed files coupled with the commit message types (prefixes) such as `feat`, `fix`, or `chore`.

## Configuration

You will need two create two files for Release Please:

1. `release-please-config.json` - its configuration file
2. `.release-please-manifest.json` - manifest file tracking last-released versions of each package

### Release Please Configuration File

First, let's create `release-please-config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "include-component-in-tag": true,
  "packages": {
    "plugins/<plugin-name>": {
      "release-type": "simple",
      "component": "<plugin-name>",
      "extra-files": [
        {
          "type": "json",
          "path": ".claude-plugin/plugin.json",
          "jsonpath": "$.version"
        }
      ]
    }
  }
}
```

> If you only have a single plugin and no marketplace file, change the key in `packages` from `plugins/<plugin-name>` to `.`.

You can change `<plugin-name>` to the name of a plugin you want to version. If you have multiple, add more entries to the `packages` property, repeating the same pattern for each plugin (where the key is a relative path and the value is its configuration).

I'll explain what each of these properties does:

1. `include-component-in-tag`: When Release Please creates a GitHub Release, it will create the Git tag too (since that is a prerequisite, afaik). This controls how the tag is named. If `<plugin-name>` was `butts`, the tag would be `butts-v1.0.0` and would be reflected in the GitHub Release.
2. `packages`: This is the main configuration for each "package", which in our case is each Claude Plugin.
   1. The `release-type` property `simple` means that it will only create a Release and update a `CHANGELOG.md` file. No trying to update a `package.json` or any other language-specific manifest.
   2. The `component` property is the name of the plugin. This is used to identify the plugin in the GitHub Release and in the Git tag.
   3. The `extra-files` property is a list of _arbitrary files_ that Release Please will update when the version is bumped. In our case, we want to update the `version` property in the `plugin.json` file. We can use [JSONPath][] to query the exact property we wish to update, which is the root `version` property.

> [!CAUTION]
> You may want to avoid `separate-pull-requests` for now; see https://github.com/googleapis/release-please/issues/1870.

### Release Please Manifest File

We need to create a manifest file to track the last-released version of each plugin. If your plugins don't have versions yet, they do now. `.release-please-manifest.json` should look like this:

```json
{
  "plugins/<plugin-name>": "0.1.0"
}
```

> If you only have a single plugin and no marketplace file, replace `plugins/<plugin-name>` with `.`.

Replace `<plugin-name>` with the directory name of the plugin. If you have multiple plugins, add more entries to the object, repeating the same pattern for each plugin. `0.1.0` is just a suggestion; you can start with whatever version you wish.

This version represents the "last released version" of the plugin; Release Please will _never_ Release this version and will instead bump it to whatever it deems appropriate based on your commit history.

Now, as Release Please does its thing, it will update this manifest file itself with the latest released version of each plugin.

> [!TIP]
> You _do_ have some control over what will happen when Release Please runs for the first time; if you want it to ignore all changes before a specific commit SHA, you can add a `"bootstrap-sha": "<sha>"` property to the root of `release-please-config.json`.

### Marketplace File

> If your repo only has a single plugin, you can ignore this and move to the next section.

Your `.claude-plugin/marketplace.json` file should look like this:

```json
{
  "plugins": [
    {
      "name": "<plugin-name>",
      "source": "./plugins/<plugin-name>"
    }
  ]
}
```

Repeat the same pattern for each plugin. **Do not add any other metadata to this file**; the metadata will instead live in the plugin's `.claude-plugin/plugin.json` file.

### Claude Plugin Manifest File

For each plugin, you'll need a `.claude-plugin/plugin.json` file. This is where the metadata for each plugin lives. It should look like this:

```json
{
  "author": {
    "name": "<your-name>"
  },
  "description": "Synergizes cross-functional paradigms to deliver actionable value-add through bleeding-edge innovation pipelines",
  "keywords": ["spaghetti", "noodles", "pasta"],
  "license": "<license-name>",
  "name": "<plugin-name>",
  "version": "0.1.0"
}
```

These fields should be pretty self-explanatory. The `version` field should _always_ match whatever is in `.release-please-manifest.json`. If it doesn't, well, Release Please will change it based on the manifest file _anyway_, so it might as well be.

## GitHub Actions Workflow

The easiest way to run Release Please is with the [Release Please Action][]. You'll want a new workflow file for this; create `.github/workflows/release.yml` and it should look like this:

```yaml
name: Release

concurrency:
  group: ${{ github.workflow }}

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  release-please:
    name: Release Please
    runs-on: ubuntu-latest
    steps:
      - name: Create Release
        uses: googleapis/release-please-action@4 # pin this to a SHA instead
```

There are a handful things here that you should know about:

1. `concurrency`: Release Please Action shouldn't be running concurrently with itself. Don't cross the streams. This prevents the end of all things.
2. This will only ever run when you push (or merge a PR into) the `main` branch. Change this to whatever your "trunk" branch is.
3. `permissions`:
   1. `contents`: It needs to be able to write to the repository (creates a branch).
   2. `issues`: It needs to be able to create its own labels. It creates no issues.
   3. `pull-requests`: It needs to be able to create pull requests. This is what it does, after all.
4. This is like bare minimum security-conscious thing you can do here, but **pin an SHA** instead of using a tag or version number. Go to the [Release Please Action repo][] and _find all 40 characters of the SHA for the latest release_ and paste it after the `@`.

## GitHub Setup

There's one final piece to this puzzle: you **must** go into `https://github.com/<org>/<repo>/settings/actions` and enable "Allow GitHub Actions to create and approve pull requests" for the repo (it's near the bottom).

This is required for Release Please to create Pull Requests; the permissions in the workflow file are not enough.

## Gotchas & Tips

- You won't get a PR if your commit messages don't contain a `fix` or `feat` type prefix. Anything else is ignored.
- You can just sit and wait on an open PR for as long as you want; Release Please will continually update it. Nothing will be relesed until you push the button.
- Release Please has a lot of configuration options, so if it's not quite doing the thing what you want, you may be able to coax it into doing that thing. Like this.
- If Release Please is freaking you out, you can temporarily disable it workflow from the Actions>Workflows>Workflow page in the GitHub UI without nuking the YAML.
- For a working example, see [boneskull/claude-plugins][].

> _— [boneskull][] on Dec 22 2025_

[release please]: https://github.com/googleapis/release-please
[claude plugin]: https://code.claude.com/docs/en/plugins
[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/
[jsonpath]: https://en.wikipedia.org/wiki/JSONPath
[release please action]: https://github.com/googleapis/release-please-action
[boneskull/claude-plugins]: https://github.com/boneskull/claude-plugins
[boneskull]: https://github.com/boneskull
