const fs = require('fs');
const path = require('path');

const directory = './lib'; // Change this to the target directory if needed

fs.readdir(directory, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        const ext = path.extname(file);
        if (ext === '.jsx' || ext === '.js') {
            const oldPath = path.join(directory, file);
            const newExt = ext === '.jsx' ? '.tsx' : '.ts';
            const newPath = path.join(directory, path.basename(file, ext) + newExt);

            fs.rename(oldPath, newPath, err => {
                if (err) {
                    console.error(`Error renaming ${file}:`, err);
                } else {
                    console.log(`Renamed: ${file} -> ${path.basename(newPath)}`);
                }
            });
        }
    });
});