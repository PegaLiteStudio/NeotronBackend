const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const {spawn} = require("child_process");
const sharp = require("sharp");

class ApkGenerator {
    constructor(adminID, appName, appTheme, adminConfigs, amount, packageName, id) {
        this.id = id;
        this.adminID = adminID;
        this.appName = appName;
        this.appTheme = appTheme;
        this.adminConfigs = adminConfigs;
        this.amount = amount;
        this.iconPath = path.join(__dirname, "../../data/uploads/" + id + "/app_icon.png");
        this.projectPath = path.join(__dirname, "../../data/temp/" + id + "/agent");
        this.mainProjectPath = path.join(__dirname, "../../data/main/project.zip");
        this.newPackage = "";
        this.adminPackageName = packageName;
    }

    getRandomPackage() {
        const randomPart = () => {
            const letters = "abcdefghijklmnopqrstuvwxyz";
            return Array.from({length: 6}, () =>
                letters[Math.floor(Math.random() * letters.length)]
            ).join("");
        };
        return `com.${randomPart()}.${randomPart()}`;
    }

    printLine(text) {
        if (!text.includes("/")) {
            io.to(connectedUsers[this.adminID]).emit("app-update", text);
        }
        console.log(text);
    }

    async unzipProject() {
        this.printLine("Preparing For Agent APK");
        this.printLine("📦 Extracting ...");

        // Remove the target directory if it already exists
        if (fs.existsSync(this.projectPath)) {
            fs.rmSync(this.projectPath, {recursive: true, force: true});
        }

        await fs
            .createReadStream(this.mainProjectPath)
            .pipe(unzipper.Extract({path: this.projectPath}))
            .promise();

        this.printLine("✅ Project extracted");
    }

    renamePackage() {
        const oldPackage = "com.pegalite.neotron3";
        this.newPackage = this.getRandomPackage();

        this.printLine(`🎯 New random package: ${this.newPackage}`);

        // Define file paths
        const appPath = path.join(this.projectPath, "app");
        const gradleFile = path.join(appPath, "build.gradle.kts");
        const manifestFile = path.join(appPath, "src", "main", "AndroidManifest.xml");
        const srcPath = path.join(appPath, "src", "main", "java");

        const replaceInFile = (filePath, oldStr, newStr) => {
            const content = fs.readFileSync(filePath, "utf8");
            const updatedContent = content.replace(new RegExp(oldStr, "g"), newStr);
            fs.writeFileSync(filePath, updatedContent, "utf8");
            this.printLine(`✅ Updated: ${path.basename(filePath)}`);
        };

        // Replace in gradle and manifest files
        replaceInFile(gradleFile, `namespace = "${oldPackage}"`, `namespace = "${this.newPackage}"`);
        replaceInFile(gradleFile, `applicationId = "${oldPackage}"`, `applicationId = "${this.newPackage}"`);
        replaceInFile(manifestFile, `package="${oldPackage}"`, `package="${this.newPackage}"`);

        // Rename directories and files recursively
        const oldPath = path.join(srcPath, ...oldPackage.split("."));
        const newPath = path.join(srcPath, ...this.newPackage.split("."));

        if (fs.existsSync(oldPath)) {
            // Ensure the new directory exists
            fs.mkdirSync(newPath, {recursive: true});

            // Recursively copy and rename files and folders
            const renameAndCopyFiles = (src, dest) => {
                const items = fs.readdirSync(src);
                items.forEach(item => {
                    const srcItemPath = path.join(src, item);
                    const destItemPath = path.join(dest, item);

                    if (fs.statSync(srcItemPath).isDirectory()) {
                        // If it's a directory, recurse into it
                        fs.mkdirSync(destItemPath, {recursive: true});
                        renameAndCopyFiles(srcItemPath, destItemPath);
                    } else {
                        // If it's a file, copy and rename it
                        fs.copyFileSync(srcItemPath, destItemPath);
                    }
                });
            };

            // Call the function to copy and rename
            renameAndCopyFiles(oldPath, newPath);

            // Remove the old directory after copying
            fs.rmSync(oldPath, {recursive: true, force: true});
            this.printLine("✅ Renamed and copied package directories");
        }

        // Update all Java and Kotlin files in the new path
        const updateJavaFiles = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach((file) => {
                const filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    updateJavaFiles(filePath);
                } else if (file.endsWith(".java") || file.endsWith(".kt")) {
                    replaceInFile(filePath, oldPackage, this.newPackage);
                }
            });
        };

        updateJavaFiles(newPath);
        this.printLine(`✅ Package renamed to: ${this.newPackage}`);
        return this.newPackage;
    }

    initProject() {
        const localPath = path.join(this.projectPath, "local.properties");
        const sdkDir = `sdk.dir=${process.env.SDK_PATH}`;
        fs.writeFileSync(localPath, sdkDir, {encoding: 'utf8'});

        const gradlePath = path.join(this.projectPath, "app", "build.gradle.kts");
        let gradleContent = fs.readFileSync(gradlePath, 'utf8');

        gradleContent = gradleContent.replace(/var path = .*/g, `var path = "${process.env.KEY_PATH}"`);
        gradleContent = gradleContent.replace(/var storePassword = .*/g, `var storePassword = "${process.env.STORE_PASS}"`);
        gradleContent = gradleContent.replace(/var keyAlias = .*/g, `var keyAlias = "${process.env.KEY_ALIAS}"`);
        gradleContent = gradleContent.replace(/var keyPassword = .*/g, `var keyPassword = "${process.env.KEY_PASS}"`);

        fs.writeFileSync(gradlePath, gradleContent, 'utf8');
    }

    updateAppName() {
        const manifestPath = path.join(this.projectPath, "app", "src", "main", "AndroidManifest.xml");
        const stringsPath = path.join(this.projectPath, "app", "src", "main", "res", "values", "strings.xml");

        if (!fs.existsSync(manifestPath)) {
            this.printLine(`Error: AndroidManifest.xml not found at ${manifestPath}`);
            return;
        }
        let manifestContent = fs.readFileSync(manifestPath, "utf8");

        if (manifestContent.includes('@string/app_name')) {
            if (!fs.existsSync(stringsPath)) {
                this.printLine(`Error: strings.xml not found at ${stringsPath}`);
                return;
            }
            let stringsContent = fs.readFileSync(stringsPath, "utf8");
            const newStringTag = `<string name="app_name">${this.appName}</string>`;
            const newStringsContent = stringsContent.replace(
                /<string\s+name="app_name">.*?<\/string>/,
                newStringTag
            );
            fs.writeFileSync(stringsPath, newStringsContent, "utf8");
            this.printLine(`Updated strings.xml with new app name: "${this.appName}"`);
        } else {
            const newLabelAttribute = `android:label="${this.appName}"`;
            const newManifestContent = manifestContent.replace(
                /android:label=".*?"/,
                newLabelAttribute
            );
            fs.writeFileSync(manifestPath, newManifestContent, "utf8");
            this.printLine(`Updated AndroidManifest.xml with new app name: "${this.appName}"`);
        }


    }

    updateAdminID() {
        this.printLine(`Updating Utils"`);
        const utilsPath = path.join(this.projectPath, "app", "src", "main", "java", this.newPackage.replaceAll(".", "/"), "functions", "Utils.java");
        let utilsContent = fs.readFileSync(utilsPath, "utf8");
        const newIDAttribute = `ADMIN_ID = "${this.adminPackageName}"`;
        const newUtilsContent = utilsContent.replace(
            /ADMIN_ID = ".*?"/,
            newIDAttribute
        );
        fs.writeFileSync(utilsPath, newUtilsContent, "utf8");
        this.printLine(`Updated Utils with new key"`);
    }

    updateAmount() {
        if (!this.amount) {
            return;
        }
        const utilsPath = path.join(this.projectPath, "app", "src", "main", "java", this.newPackage.replaceAll(".", "/"), "functions", "Utils.java");
        let utilsContent = fs.readFileSync(utilsPath, "utf8");
        const newIDAttribute = `AMOUNT = "${this.amount}"`;
        const newUtilsContent = utilsContent.replace(
            /AMOUNT = ".*?"/,
            newIDAttribute
        );
        fs.writeFileSync(utilsPath, newUtilsContent, "utf8");
        this.printLine(`Updated Utils with Amount"`);
    }

    updateTheme() {
        if (!this.appTheme) {
            return;
        }
        const utilsPath = path.join(this.projectPath, "app", "src", "main", "java", this.newPackage.replaceAll(".", "/"), "functions", "Utils.java");
        let utilsContent = fs.readFileSync(utilsPath, "utf8");
        const newIDAttribute = `THEME = "${this.appTheme}"`;
        const newUtilsContent = utilsContent.replace(
            /THEME = ".*?"/,
            newIDAttribute
        );
        fs.writeFileSync(utilsPath, newUtilsContent, "utf8");
        this.printLine(`Updated Utils with THEME"`);
    }

    updateConfigs() {
        if (!this.adminConfigs) {
            return;
        }
        const utilsPath = path.join(this.projectPath, "app", "src", "main", "java", this.newPackage.replaceAll(".", "/"), "functions", "Utils.java");
        let utilsContent = fs.readFileSync(utilsPath, "utf8");
        const newIDAttribute = `CONFIGS = "${this.adminConfigs}"`;
        const newUtilsContent = utilsContent.replace(
            /CONFIGS = ".*?"/,
            newIDAttribute
        );
        fs.writeFileSync(utilsPath, newUtilsContent, "utf8");
        this.printLine(`Updated Utils with CONFIGS"`);
    }

    copyFile(source, destination) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(source)) {
                const errMsg = `Source file does not exist: ${source}`;
                console.error(errMsg);
                return reject(new Error(errMsg));
            }

            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const ext = path.extname(source).toLowerCase();
            const isImage = imageExtensions.includes(ext);

            let destinationPath = destination;
            if (fs.existsSync(destination)) {
                const stat = fs.lstatSync(destination);
                if (stat.isDirectory()) {
                    destinationPath = path.join(destination, path.basename(source));
                }
            }

            if (isImage) {
                // 1) Resize image to 220x220 and get buffer
                sharp(source)
                    .resize({
                        width: 220,
                        height: 220,
                        fit: 'contain',
                        background: {r: 0, g: 0, b: 0, alpha: 0} // Transparent background
                    })
                    .toBuffer()
                    .then((resizedBuffer) => {
                        // 2) Create a 324x324 canvas and center the 220x220 image
                        return sharp({
                            create: {
                                width: 324,
                                height: 324,
                                channels: 4,
                                background: {r: 0, g: 0, b: 0, alpha: 0} // Transparent canvas
                            }
                        })
                            .composite([{input: resizedBuffer, gravity: 'center'}])
                            .toFile(destinationPath);
                    })
                    .then(() => {
                        this.printLine(
                            `✅ Image scaled (220x220) and padded to 324x324 [${path
                                .basename(destinationPath)
                                .replace('app.', this.appName + '.')}].`
                        );
                        resolve();
                    })
                    .catch((err) => {
                        console.error(`Error scaling and padding image: ${err}`);
                        reject(err);
                    });
            } else {
                // Copy non-image files directly
                fs.copyFile(source, destinationPath, (err) => {
                    if (err) {
                        console.error(`Error copying file: ${err}`);
                        return reject(err);
                    } else {
                        this.printLine(
                            `✅ File copied successfully [${path
                                .basename(destinationPath)
                                .replace('app.', this.appName + '.')}].`
                        );
                        resolve();
                    }
                });
            }
        });
    }


    replaceIcons() {
        return new Promise((resolve, reject) => {
            try {
                const dir = path.join(this.projectPath, "app", "src", "main", "res", "mipmap-anydpi/");
                const files = fs.readdirSync(dir);
                files.forEach((file) => {
                    if (file.endsWith(".xml")) {
                        const filePath = path.join(dir, file);
                        let content = fs.readFileSync(filePath, "utf8");
                        const updatedContent = content
                            .replace(/<background android:drawable="[^"]*"/g, '<background android:drawable="@drawable/app_icon"')
                            .replace(/<foreground android:drawable="[^"]*"/g, '<foreground android:drawable="@drawable/app_icon"')
                            .replace(/<monochrome android:drawable="[^"]*"/g, '<monochrome android:drawable="@drawable/app_icon"');
                        if (content !== updatedContent) {
                            fs.writeFileSync(filePath, updatedContent, "utf8");
                            this.printLine(`Updated: ${path.basename(filePath)}`);
                        }
                    }
                });
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    async generateAdaptiveIcon() {
        try {
            const drawablePath = path.join(this.projectPath, "app", "src", "main", "res", "drawable");

            // Ensure drawable directory exists
            fs.mkdirSync(drawablePath, { recursive: true });

            const foregroundOutput = path.join(drawablePath, "app_icon_foreground.png");
            const backgroundXmlPath = path.join(drawablePath, "app_icon_background.xml");

            this.printLine("🎨 Generating adaptive icon assets...");

            // Resize icon to 220x220 and center it in 324x324 transparent canvas
            const resizedBuffer = await sharp(this.iconPath)
                .resize({
                    width: 220,
                    height: 220,
                    fit: "contain",
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                .toBuffer();

            await sharp({
                create: {
                    width: 324,
                    height: 324,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                },
            })
                .composite([{ input: resizedBuffer, gravity: "center" }])
                .png()
                .toFile(foregroundOutput);

            this.printLine("✅ app_icon_foreground.png created.");

            // Create white background drawable XML
            const whiteBgXml = `<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF"/>
</shape>`;
            fs.writeFileSync(backgroundXmlPath, whiteBgXml, "utf8");
            this.printLine("✅ app_icon_background.xml created.");

            // Create mipmap-anydpi-v26 directory if missing
            const mipmapDir = path.join(this.projectPath, "app", "src", "main", "res", "mipmap-anydpi-v26");
            fs.mkdirSync(mipmapDir, { recursive: true });

            // Write ic_launcher.xml referencing the adaptive icon layers
            const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/app_icon_background"/>
    <foreground android:drawable="@drawable/app_icon_foreground"/>
</adaptive-icon>`;
            fs.writeFileSync(path.join(mipmapDir, "ic_launcher.xml"), icLauncherXml, "utf8");
            this.printLine("✅ ic_launcher.xml created in mipmap-anydpi-v26.");

            this.printLine("✅ Adaptive icon setup complete.");
        } catch (err) {
            this.printLine(`❌ Error in generateAdaptiveIcon: ${err.message}`);
            throw err;
        }
    }


    buildApk() {
        return new Promise((resolve, reject) => {
            this.printLine("⚙️ Cleaning & building APK...");
            const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

            const buildProcess = spawn(gradleCommand, ["clean", "assembleRelease"], {
                cwd: this.projectPath,
                shell: true,
            });

            buildProcess.stdout.on("data", (data) => {
                this.printLine(data.toString());
            });

            buildProcess.stderr.on("data", (data) => {
                this.printLine(data.toString());
            });

            buildProcess.on("close", (code) => {
                this.printLine(`Build process exited with code ${code}`);
                if (code === 0) {
                    this.printLine("✅ APK built successfully!");
                    this.printLine("DOWNLOAD_NOW");
                    resolve();
                } else {
                    this.printLine("❌ APK build failed.");
                    reject(new Error(`Build failed with code ${code}`));
                }
            });
        });
    }


    async apkGenerator() {
        try {
            await this.unzipProject();
            this.renamePackage();
            this.initProject();

            this.updateAppName();

            this.updateAdminID();
            this.updateAmount();
            this.updateTheme();
            this.updateConfigs();

            const destinationIcon = path.join(this.projectPath, "app", "src", "main", "res", "drawable/");

            // await this.copyFile(this.iconPath, destinationIcon);
            // await this.replaceIcons();
            await this.generateAdaptiveIcon();

            await this.buildApk();
            this.printLine("PROCESS_ENDED");
        } catch (error) {
            this.printLine("PROCESS_ENDED");
            this.printLine(`Error during APK generation: ${error.message}`);
        }
    }
}


module.exports = ApkGenerator