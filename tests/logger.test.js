import { logger } from "../src/logger.js";
import path from "path";
import fs from "fs/promises";

let log = null;
afterEach(async () => {
    if (log) {
        await log.close();
        log = null;
    }
});

describe("logger", () => {

    test("no debe lanzar error con objetos circulares", () => {

        log = logger("test");

        const obj = {};
        obj.self = obj;

        expect(() => {
            log.error(obj);
        }).not.toThrow();

    });

    test("debe registrar un objeto circular sin lanzar excepción", async () => {

        log = logger("jest");

        const obj = {
            nombre: "Cristian"
        };

        obj.self = obj;

        expect(() => log.error(obj)).not.toThrow();

        const dir = path.join("logs", "jest");
        const files = await fs.readdir(dir);

        expect(files.length).toBeGreaterThan(0);

        const logFile = path.join(dir, files[0]);
        const content = await fs.readFile(logFile, "utf8");

        expect(content).toContain('"nombre": "Cristian"');
        expect(content).toContain("[Circular]");

    });

});