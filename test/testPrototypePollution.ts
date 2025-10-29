const csv = require("../src");
const assert = require("assert");

describe("Prototype Pollution", function () {
  it("should not allow prototype pollution", async function () {
    const csvData = "a.__proto__.polluted,b.prototype.polluted\n1,2";
    let polluted = false;

    if (({} as any).polluted) {
      polluted = true;
    }
    delete (Object.prototype as any).polluted;

    await csv().fromString(csvData);
    assert.strictEqual(({} as any).polluted, undefined, "Prototype should not be polluted");
    if (polluted) {
      delete (Object.prototype as any).polluted;
    }
  });
});
