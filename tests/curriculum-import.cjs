const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../extra.js'), 'utf8'), context);
const text = `CURRICULUM
SEMESTER - I
SEMESTER - II
Course Title
1   Example Physics   MC   4   3   0   2   4
2   Practical Studies   MC   4   0   0   4   2
Total 8 3 0 6 6
Course Title
1   Another Subject   MC   3   3   0   0   3
Total 3 3 0 0 3
SYLLABUS
SEMESTER - I
Course
Code
Category EXAMPLE
PHYSICS
L T P C
UNIT 1 MOTION (9 HOURS)
Velocity - Acceleration
TEXTBOOKS
Course
Code
Category PRACTICAL STUDIES
L T P C
Tentative List of Experiments:
1. Measure velocity
COURSE OUTCOMES`;
const result = context.parseCurriculum(text);
assert.equal(result.length, 2);
assert.equal(result[0].courses.length, 2);
assert.equal(result[1].courses.length, 1);
assert.equal(result[0].courses[0].credits, 4);
assert.equal(result[0].courses[0].units[0].topics.length, 2);
assert.equal(result[0].courses[1].units[0].name, 'Practical experiments');
assert.equal(result[0].courses[1].units[0].topics[0], 'Measure velocity');
assert.equal(result[1].courses[0].units.length, 0);
const generic = context.parseCurriculum('Semester 1\nCS101 Introduction to Computing\nUnit 1 Basics\nAlgorithms - Data');
assert.equal(generic[0].courses[0].code, 'CS101');
assert.equal(generic[0].courses[0].units[0].topics.length, 2);
console.log('Curriculum importer checks passed.');
