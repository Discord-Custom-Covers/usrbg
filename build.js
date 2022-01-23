const core = require('@actions/core');
const { writeFileSync } = require('fs');
const { MongoClient } = require('mongodb')
const client = new MongoClient(process.env.MONGODB_URI)

async function read(query, type = "uid") {
    await client.connect();

    const res = await client.db("usrbg").collection("usrbg").find(query ? { [type]: query } : {}).toArray();

    await client.close()

    return res.length > 1 ? res : res[0]
}

async function compile() {
    const data = await read()
    writeFileSync("./dist/usrbg.json", JSON.stringify(data))

    const createRule = (uids, rules) => `${uids.map(uid => `.root-8LYsGj[data-user-id="${uid}"],.userPopout-2j1gM4[data-user-id="${uid}"]`).join()}{${rules.join("")}}`

    const backgrounds = new Map(Object.entries({ none: new Map, left: new Map, right: new Map }))

    for (const { orientation, img, uid } of data) {
        const map = backgrounds.get(orientation);
        const background = map.get(img);
        if (!background) map.set(img, [uid]);
        else background.push(uid);
    }

    const css = [...backgrounds].map(([orientation, map]) => {
        return [...map].map(([img, uids]) => {
            if (orientation === "none") return createRule(uids, [`--user-background:url("${img}")`])
            else return createRule(uids, [`--user-background:url("${img}");`, `--user-popout-position:${orientation}!important`])
        }).join("");
    }).join("");
    return ".userPopout-2j1gM4{--user-popout-position:center}" + css
}


try { compile().then(css => writeFileSync("./dist/usrbg.css", css)) }
catch (err) { core.setFailed(err.message); }
