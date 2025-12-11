const fs = require('fs');
try {
    const data = fs.readFileSync('submission_output.json', 'utf8');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
} catch (e) {
    console.log(require('fs').readFileSync('submission_output.json', 'utf8').substring(0, 500));
}
