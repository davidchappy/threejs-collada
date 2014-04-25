class ColladaConverterMaterialMap {
    symbols: { [symbol: string]: ColladaConverterMaterial };

    constructor() {
        this.symbols = {};
    }
}

class ColladaConverterMaterial {
    id: string;
    diffuse: ColladaConverterTexture;
    specular: ColladaConverterTexture;
    normal: ColladaConverterTexture;

    constructor(id: string) {
        this.id = id;
        this.diffuse = null;
        this.specular = null;
        this.normal = null;
    }

    static defaultMaterialId: string = "collada conterter default material";
    static createDefaultMaterial(context: ColladaConverterContext): ColladaConverterMaterial {
        var result: ColladaConverterMaterial = context.findMaterial(ColladaConverterMaterial.defaultMaterialId);
        if (result) {
            return result;
        } else {
            result = new ColladaConverterMaterial(ColladaConverterMaterial.defaultMaterialId);
            context.registerMaterial(result);
            return result;
        }
    }

    static createMaterial(instanceMaterial: ColladaInstanceMaterial, context: ColladaConverterContext): ColladaConverterMaterial {

        var material: ColladaMaterial = ColladaMaterial.fromLink(instanceMaterial.material, context);
        if (material === null) {
            context.log.write("Material not found, material skipped.", LogLevel.Warning);
            return ColladaConverterMaterial.createDefaultMaterial(context);
        }

        var effect: ColladaEffect = ColladaEffect.fromLink(material.effect, context);
        if (effect === null) {
            context.log.write("Material effect not found, using default material", LogLevel.Warning);
            return ColladaConverterMaterial.createDefaultMaterial(context);
        }

        var technique: ColladaEffectTechnique = effect.technique;
        if (technique === null) {
            context.log.write("Material effect not found, using default material", LogLevel.Warning);
            return ColladaConverterMaterial.createDefaultMaterial(context);
        }

        if (technique.diffuse.color !== null || technique.specular.color !== null || technique.bump.color !== null) {
            context.log.write("Material " + material.id + " contains constant colors, colors ignored", LogLevel.Warning);
        }

        var result: ColladaConverterMaterial = context.findMaterial(ColladaConverterMaterial.defaultMaterialId);
        if (result) return result;

        result = new ColladaConverterMaterial(material.id);
        result.id = material.id;
        result.diffuse = ColladaConverterTexture.createTexture(technique.diffuse, context);
        result.specular = ColladaConverterTexture.createTexture(technique.specular, context);
        result.normal = ColladaConverterTexture.createTexture(technique.bump, context);
        context.registerMaterial(result);

        return result;
    }

    static getMaterialMap(instanceMaterials: ColladaInstanceMaterial[], context: ColladaConverterContext): ColladaConverterMaterialMap {
        var result: ColladaConverterMaterialMap = new ColladaConverterMaterialMap();

        var numMaterials: number = 0;
        for (var i: number = 0; i < instanceMaterials.length; i++) {
            var instanceMaterial: ColladaInstanceMaterial = instanceMaterials[i];

            var symbol: string = instanceMaterial.symbol;
            if (symbol === null) {
                context.log.write("Material instance has no symbol, material skipped.", LogLevel.Warning);
                continue;
            }

            if (result.symbols[symbol] != null) {
                context.log.write("Material symbol " + symbol + " used multiple times", LogLevel.Error);
                continue;
            }

            result.symbols[symbol] = ColladaConverterMaterial.createMaterial(instanceMaterial, context);
        }
        return result;
    }
}