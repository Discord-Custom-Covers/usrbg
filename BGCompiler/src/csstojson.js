const fs = require("fs");
const css = require("css");

const cssFile = process.argv[2];

// Yes this looks like shit, but did you know that it's actually the most efficient method of doing this? StackOverflow truly is a miracle.
const outFile =
  process.argv[3] != undefined
    ? process.argv[3]
    : `${cssFile.split("\\").pop().split("/").pop().split(".")[0]}.json`;

if (cssFile == undefined) {
  console.log(
    "\x1b[31m[ERROR] BGCompiler requires a css file to build a JSON file from.\x1b[0m"
  );
  process.exit(1);
}

const usrbg = css.parse(fs.readFileSync(cssFile, "utf-8")).stylesheet;
const quotesRegex = /(["'])(.*?[^\\])\1/g;

function getStringWithinQuotes(string) {
  return string.match(/(["'])(.*?[^\\])\1/)[2];
}

try {
  var backgroundObject = {};
  for (const rule of usrbg.rules) {
    if (rule.type == "rule") {
      if (rule.selectors[0].includes("data-user-id")) {
        var position = "center";
        for (selector of rule.selectors) {
          for (match of selector.matchAll(quotesRegex)) {
            /*
            There's duplicates in the list as the regex will find both
            .root-SR8cQa [data-user-id="USER ID"],
            .userPopout-3XzG_A [data-user-id="USER ID"]
            but since this block of code will return the same thing regardless, it really wouldn't matter.

            I wouldn't have done it this way if the top of userbg.css wasn't 
            .root-SR8cQa [data-user-id="254362351170617345"],
            .userPopout-3XzG_A [data-user-id="254362351170617345"],
            .root-SR8cQa [data-user-id="365643222522920960"],
            .userPopout-3XzG_A [data-user-id="365643222522920960"] {
              --user-background: url("https://i.imgur.com/qQBk2cR.jpg");
            }
            but since they're all in one selector the simplest way is how I do it.
            */
            var userId = match[2];

            for (const declaration of rule.declarations) {
              if (declaration.property == "--user-background") {
                var background = getStringWithinQuotes(declaration.value);
              }

              if (declaration.property == "--user-popout-position") {
                position = declaration.value.replace("!important", "").trim();
              }
            }
            backgroundObject[userId] = {
              background: background,
              ...(position != "center" ? { orientation: position } : {}),
            };
          }
        }
      }
    }
  }

  const backgroundList = JSON.stringify(backgroundObject, null, 2);
  fs.writeFileSync(outFile, backgroundList);
  console.log(`\x1b[32m[SUCCESS] Output file: ${outFile}\x1b[0m`);
} catch (err) {
  console.log(`\x1b[31m[ERROR]: ${err}\x1b[0m`);
  process.exit(1);
}
