export default {
  branches: ['main'],
  tagFormat: '${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { breaking: true, release: 'minor' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'revert', release: 'patch' },
          { type: 'build', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'docs', release: false },
          { type: 'refactor', release: false },
          { type: 'style', release: false },
          { type: 'test', release: false },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'angular',
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/exec',
      {
        verifyReleaseCmd:
          'case "${nextRelease.version}" in 0.*) exit 0;; *) echo "Refusing ${nextRelease.version}: only 0.x allowed" >&2; exit 1;; esac',
      },
    ],
  ],
};
