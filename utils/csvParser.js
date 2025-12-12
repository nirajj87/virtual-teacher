const fs = require('fs');
const csv = require('csv-parser');

async function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Clean and validate row data
                const cleanedRow = {};
                
                for (const key in row) {
                    if (row.hasOwnProperty(key)) {
                        // Clean up the key (remove BOM, trim)
                        const cleanKey = key.replace(/^\uFEFF/, '').trim();
                        cleanedRow[cleanKey] = row[key]?.toString().trim() || '';
                    }
                }
                
                // Map common column names
                const question = 
                    cleanedRow.question || 
                    cleanedRow.Question || 
                    cleanedRow['Question '] || 
                    cleanedRow['question '] || '';
                
                const answer = 
                    cleanedRow.answer || 
                    cleanedRow.Answer || 
                    cleanedRow['Answer '] || 
                    cleanedRow['answer '] || '';
                
                const category = 
                    cleanedRow.category || 
                    cleanedRow.Category || 
                    cleanedRow['Category '] || 
                    cleanedRow['category '] || 
                    'General';
                
                if (question && answer) {
                    results.push({
                        question: question,
                        answer: answer,
                        category: category
                    });
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

module.exports = parseCSV;