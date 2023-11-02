import { inferProcedureOutput } from "@trpc/server";
import { processCardImage } from "./image-service";
import { generateCardData } from "./openai-service";
import { uploadToS3 } from "./s3-service";
import { AppRouter } from "@/server/api/root";
import fakeImage from "@/fakeImage";

// const makeCard: (prompt: string) => inferProcedureOutput<AppRouter["card"]["create"]> = (prompt) => {
const makeCard: (prompt: string) => any = async (prompt) => {

    try {
        const card = await generateCardData(prompt);
        // const card = fakeImage;

        const convertedImage = await processCardImage(card.image);

        if (!convertedImage) throw Error("No data returned from image processing");

        const keyName = `${card.title}:${card.desc.substring(0, 32)}:${Date.now()}`;

        const location = await uploadToS3(keyName, convertedImage);

        console.log("location?", location);

        return Promise.resolve({
            card: {
                title: card.title,
                description: card.desc,
                attack: card.atk,
                defense: card.def,
                rarity: card.rarity,
            },
            imageUrl: location
        });
    } catch (e) {
        return Promise.reject(e);
    }
};

export default makeCard;