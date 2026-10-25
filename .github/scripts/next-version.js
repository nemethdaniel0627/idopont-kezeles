// Prints "version=X.Y.Z", the version of the release being made (for the Release workflow):
// - package.json's version, when it is newer than the latest release tag (set by hand on master for a bigger step);
// - otherwise the latest release tag with its last number one higher.
const { execSync } = require('child_process');
const path = require('path');

const current = require(path.join(__dirname, '..', '..', 'package.json')).version;
const parse = version => version.split('.').map(Number);
const compare = (a, b) => {
    const [x, y] = [parse(a), parse(b)];
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
};

const tags = execSync('git tag --list "v*"', { encoding: 'utf8' })
    .split('\n').map(tag => tag.trim().replace(/^v/, '')).filter(tag => /^\d+\.\d+\.\d+$/.test(tag));
const latest = tags.sort(compare).pop();

let next = current;
if (latest && compare(current, latest) <= 0) {
    const [major, minor, patch] = parse(latest);
    next = `${major}.${minor}.${patch + 1}`;
}
console.log(`version=${next}`);
