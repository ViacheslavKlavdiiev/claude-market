#!/usr/bin/env sh
# Template helper script for a skill.
#
# Portability rules (see docs/PLUGIN-GUIDELINES.md):
#   - POSIX shell, forward slashes only.
#   - Reference plugin files via ${CLAUDE_PLUGIN_ROOT}, never with ../ paths,
#     because plugins run from a cache copy, not the cloned repo.
#
# Replace this with a real helper, or delete scripts/ if the skill needs none.
echo "hello from example-plugin"
