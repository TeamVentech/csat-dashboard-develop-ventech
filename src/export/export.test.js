// Manual test file for CSV exports
const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify');

/**
 * Test that csv-stringify works correctly
 */
function testCsvStringify() {
  // Sample data
  const data = [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 },
    { id: 3, name: 'Bob', age: 40 }
  ];

  // Create a CSV stringifier
  const stringifier = stringify({ header: true });
  
  // Create a write stream
  const outputPath = path.join(__dirname, 'test-output.csv');
  const writeStream = fs.createWriteStream(outputPath);
  
  // Pipe the stringifier to the write stream
  stringifier.pipe(writeStream);
  
  // Write each row to the stringifier
  data.forEach(row => stringifier.write(row));
  
  // End the stringifier
  stringifier.end();
  
  // Wait for the write stream to finish
  writeStream.on('finish', () => {
    const content = fs.readFileSync(outputPath, 'utf8');
    fs.unlinkSync(outputPath);
  });
}

testCsvStringify(); 