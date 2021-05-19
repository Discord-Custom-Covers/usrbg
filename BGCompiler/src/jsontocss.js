const fs = require("fs").promises;

(async function () {
  const jsonFile = process.argv[2];
  if (jsonFile == undefined) {
    console.log(
      "\x1b[31m[ERROR] BGCompiler requires a JSON file to build a css file from.\x1b[0m"
    );
    process.exit(1);
  }

  // Yes this looks like shit, but did you know that it's actually the most efficient method of doing this? StackOverflow truly is a miracle.
  const outFile =
    process.argv[3] != undefined
      ? process.argv[3]
      : `${jsonFile.split("\\").pop().split("/").pop().split(".")[0]}.css`;

  const template = [
    '.root-SR8cQa [data-user-id="{userid}"]',
    '.userPopout-3XzG_A [data-user-id="{userid}"]',
  ];

  const json = JSON.parse(await fs.readFile(jsonFile));

  // This is where we store what backgrounds have what users
  var backgrounds = {};

  var positionedBackgrounds = { left: [], right: [] };

  for (const userId in json) {
    const user = json[userId];

    // The JSON file should *NOT* contain "center" as a valid orientation, but if the spec ever gets violated this handles for it
    if (!user["orientation"] || user["orientation"] == "center") {
      if (!backgrounds[user["background"]]) {
        backgrounds[user["background"]] = [];
      }

      backgrounds[user["background"]].push(userId);
    } else {
      if (!positionedBackgrounds[user["orientation"]][user["background"]]) {
        positionedBackgrounds[user["orientation"]][user["background"]] = [];
      }

      positionedBackgrounds[user["orientation"]][user["background"]].push(
        userId
      );
    }
  }

  var finalCss = `.userPopout-3XzG_A{--user-popout-position: center;}`;

  function createRule(userIds, rules) {
    var selectorList = [];

    for (const userId of userIds) {
      for (const selector of template) {
        selectorList.push(selector.replace("{userid}", userId));
      }
    }

    const finalSelector = selectorList.join(",");
    const joinedRules = rules.join("");

    return `${finalSelector}{${joinedRules}}`;
  }

  for (const background in backgrounds) {
    finalCss += createRule(backgrounds[background], [
      `--user-background:url("${background}");`,
    ]);
  }

  for (const position in positionedBackgrounds) {
    for (const background in positionedBackgrounds[position]) {
      finalCss += createRule(positionedBackgrounds[position][background], [
        `--user-background:url("${background}");`,
        `--user-popout-position:${position}!important;`,
      ]);
    }
  }

  await fs.writeFile(outFile, finalCss);
})();
