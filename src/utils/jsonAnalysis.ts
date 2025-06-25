
interface JSONAnalysisResult {
structure: {
type: string;
depth: number;
keyCount: number;
arrayCount: number;
objectCount: number;
primitiveCount: number;
};
schema: any;
validation: {
isValid: boolean;
errors: string[];
duplicateKeys: string[];
};
statistics: {
totalKeys: number;
uniqueKeys: number;
nullValues: number;
emptyStrings: number;
dataTypes: Record<string, number>;
arrayLengths: number[];
stringLengths: number[];
};
paths: string[];
comparison?: {
onlyInFirst: string[];
onlyInSecond: string[];
different: Array<{ path: string; first: any; second: any }>;
structuralDiff: boolean;
};
}

export function analyzeJSON(jsonString: string, compareWith?: string): JSONAnalysisResult {
try {
const parsed = JSON.parse(jsonString);
const result: JSONAnalysisResult = {
structure: analyzeStructure(parsed),
schema: generateSchema(parsed),
validation: validateJSON(jsonString, parsed),
statistics: generateStatistics(parsed),
paths: getAllPaths(parsed)
};

if (compareWith) {
try {
const parsedCompare = JSON.parse(compareWith);
result.comparison = compareJSONObjects(parsed, parsedCompare);
} catch (error) {
result.comparison = {
onlyInFirst: [],
onlyInSecond: [],
different: [],
structuralDiff: true
};
}
}

return result;
} catch (error) {
throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
}

function analyzeStructure(obj: any, currentDepth = 0): JSONAnalysisResult['structure'] {
const structure = {
type: Array.isArray(obj) ? 'array' : typeof obj,
depth: currentDepth,
keyCount: 0,
arrayCount: 0,
objectCount: 0,
primitiveCount: 0
};

if (obj === null || typeof obj !== 'object') {
structure.primitiveCount = 1;
return structure;
}

if (Array.isArray(obj)) {
structure.arrayCount = 1;
obj.forEach(item => {
const childStructure = analyzeStructure(item, currentDepth + 1);
structure.depth = Math.max(structure.depth, childStructure.depth);
structure.keyCount += childStructure.keyCount;
structure.arrayCount += childStructure.arrayCount;
structure.objectCount += childStructure.objectCount;
structure.primitiveCount += childStructure.primitiveCount;
});
} else {
structure.objectCount = 1;
structure.keyCount = Object.keys(obj).length;

Object.values(obj).forEach(value => {
const childStructure = analyzeStructure(value, currentDepth + 1);
structure.depth = Math.max(structure.depth, childStructure.depth);
structure.keyCount += childStructure.keyCount;
structure.arrayCount += childStructure.arrayCount;
structure.objectCount += childStructure.objectCount;
structure.primitiveCount += childStructure.primitiveCount;
});
}

return structure;
}

function generateSchema(obj: any): any {
if (obj === null) return { type: 'null' };
if (Array.isArray(obj)) {
const itemSchemas = obj.map(generateSchema);
const uniqueSchemas = itemSchemas.filter((schema, index, arr) =>
arr.findIndex(s => JSON.stringify(s) === JSON.stringify(schema)) === index
);
return {
type: 'array',
items: uniqueSchemas.length === 1 ? uniqueSchemas[0] : uniqueSchemas
};
}
if (typeof obj === 'object') {
const properties: Record<string, any> = {};
Object.keys(obj).forEach(key => {
properties[key] = generateSchema(obj[key]);
});
return { type: 'object', properties };
}
return { type: typeof obj };
}

function validateJSON(jsonString: string, parsed: any): JSONAnalysisResult['validation'] {
const errors: string[] = [];
const duplicateKeys: string[] = [];

// Check for duplicate keys
  const keyRegex = /"([^"]+)"\s*:/g;
const keys: string[] = [];
let match;
while ((match = keyRegex.exec(jsonString)) !== null) {
const key = match[1];
if (keys.includes(key)) {
duplicateKeys.push(key);
}
keys.push(key);
}

// Check for common issues
  if (jsonString.includes('NaN')) errors.push('Contains NaN values');
if (jsonString.includes('Infinity')) errors.push('Contains Infinity values');
if (jsonString.includes('undefined')) errors.push('Contains undefined values');

return {
isValid: errors.length === 0,
errors,
duplicateKeys: [...new Set(duplicateKeys)]
};
}

function generateStatistics(obj: any): JSONAnalysisResult['statistics'] {
const stats = {
totalKeys: 0,
uniqueKeys: 0,
nullValues: 0,
emptyStrings: 0,
dataTypes: {} as Record<string, number>,
arrayLengths: [] as number[],
stringLengths: [] as number[]
};

const allKeys: string[] = [];

function traverse(current: any) {
if (current === null) {
stats.nullValues++;
stats.dataTypes.null = (stats.dataTypes.null || 0) + 1;
} else if (Array.isArray(current)) {
stats.arrayLengths.push(current.length);
stats.dataTypes.array = (stats.dataTypes.array || 0) + 1;
current.forEach(traverse);
} else if (typeof current === 'object') {
stats.dataTypes.object = (stats.dataTypes.object || 0) + 1;
Object.keys(current).forEach(key => {
allKeys.push(key);
stats.totalKeys++;
traverse(current[key]);
});
} else {
const type = typeof current;
stats.dataTypes[type] = (stats.dataTypes[type] || 0) + 1;
if (type === 'string') {
stats.stringLengths.push(current.length);
if (current === '') stats.emptyStrings++;
}
}
}

traverse(obj);
stats.uniqueKeys = new Set(allKeys).size;

return stats;
}

function getAllPaths(obj: any, currentPath = ''): string[] {
const paths: string[] = [];

function traverse(current: any, path: string) {
if (path) paths.push(path);

if (Array.isArray(current)) {
current.forEach((item, index) => {
traverse(item, `${path}[${index}]`);
});
} else if (current !== null && typeof current === 'object') {
Object.keys(current).forEach(key => {
const newPath = path ? `${path}.${key}` : key;
traverse(current[key], newPath);
});
}
}

traverse(obj, currentPath);
return paths;
}

function compareJSONObjects(obj1: any, obj2: any): JSONAnalysisResult['comparison'] {
const paths1 = new Set(getAllPaths(obj1));
const paths2 = new Set(getAllPaths(obj2));

const onlyInFirst = [...paths1].filter(path => !paths2.has(path));
const onlyInSecond = [...paths2].filter(path => !paths1.has(path));
const different: Array<{ path: string; first: any; second: any }> = [];

// Compare common paths
  const commonPaths = [...paths1].filter(path => paths2.has(path));
commonPaths.forEach(path => {
const value1 = getValueByPath(obj1, path);
const value2 = getValueByPath(obj2, path);

if (JSON.stringify(value1) !== JSON.stringify(value2)) {
different.push({ path, first: value1, second: value2 });
}
});

return {
onlyInFirst,
onlyInSecond,
different,
structuralDiff: onlyInFirst.length > 0 || onlyInSecond.length > 0
};
}

function getValueByPath(obj: any, path: string): any {
return path.split('.').reduce((current, key) => {
if (key.includes('[') && key.includes(']')) {
const arrayKey = key.split('[')[0];
const index = parseInt(key.split('[')[1].split(']')[0]);
return current[arrayKey][index];
}
return current[key];
}, obj);
}

export function formatAnalysisReport(analysis: JSONAnalysisResult, jsonInput: string, compareInput?: string): string {
let report = `JSON Analysis Report - ${new Date().toLocaleString()}\n`;
report += `${'='.repeat(50)}\n\n`;

// Structure Analysis
  report += `STRUCTURE ANALYSIS:\n`;
report += `- Type: ${analysis.structure.type}\n`;
report += `- Max Depth: ${analysis.structure.depth}\n`;
report += `- Objects: ${analysis.structure.objectCount}\n`;
report += `- Arrays: ${analysis.structure.arrayCount}\n`;
report += `- Primitives: ${analysis.structure.primitiveCount}\n`;
report += `- Total Keys: ${analysis.structure.keyCount}\n\n`;

// Validation
  report += `VALIDATION:\n`;
report += `- Valid JSON: ${analysis.validation.isValid ? '✅' : '❌'}\n`;
if (analysis.validation.errors.length > 0) {
report += `- Errors: ${analysis.validation.errors.join(', ')}\n`;
}
if (analysis.validation.duplicateKeys.length > 0) {
report += `- Duplicate Keys: ${analysis.validation.duplicateKeys.join(', ')}\n`;
}
report += '\n';

// Statistics
  report += `STATISTICS:\n`;
report += `- Total Keys: ${analysis.statistics.totalKeys}\n`;
report += `- Unique Keys: ${analysis.statistics.uniqueKeys}\n`;
report += `- Null Values: ${analysis.statistics.nullValues}\n`;
report += `- Empty Strings: ${analysis.statistics.emptyStrings}\n`;
report += `- Data Types: ${Object.entries(analysis.statistics.dataTypes)
.map(([type, count]) => `${type}(${count})`)
.join(', ')}\n\n`;

// Comparison
  if (analysis.comparison) {
report += `COMPARISON RESULTS:\n`;
report += `- Structural Difference: ${analysis.comparison.structuralDiff ? '✅' : '❌'}\n`;
report += `- Only in First: ${analysis.comparison.onlyInFirst.length} paths\n`;
report += `- Only in Second: ${analysis.comparison.onlyInSecond.length} paths\n`;
report += `- Different Values: ${analysis.comparison.different.length} paths\n\n`;
}

// Schema
  report += `GENERATED SCHEMA:\n`;
report += JSON.stringify(analysis.schema, null, 2);

return report;
}