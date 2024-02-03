// upscaleCommand.js
import axios from 'axios';
import { getImageUrlByIndex } from './generateImage.js';

const upscaleImage = async (interaction, imageIndex) => {

    const interactionId = interaction.message.interaction.id; // Adjust based on your Discord.js version
    const imageUrl = getImageUrlByIndex(interactionId, imageIndex);

    try {
        // Ensure to defer the reply if the interaction hasn't been replied to or deferred
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();

        }

        // Validate imageUrl before proceeding
        if (!imageUrl) {

            await interaction.followUp({ content: 'Image URL not found.', ephemeral: true });
            return;

        }

        // Ensure imageUrl is valid before proceeding
        if (!imageUrl) {

            await interaction.followUp({ content: 'Image URL not found.', ephemeral: true });
            return;

        }

        // Proceed with the upscaling process
        const upscaleResponse = await axios.post('http://127.0.0.1:8888/v1/generation/image-upscale-vary', {
            imageUrl: imageUrl,
            upscaleFactor: "2x",
            quality: 90,
            outputFormat: "png",
            noiseReduction: true,
            sharpness: 1.5,
            model: "advanced"
        }, {
            headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
            }
        });

        // Handle the upscaled image response
        if (upscaleResponse.data && upscaleResponse.data.upscaledImageUrl) {

            await interaction.editReply({ files: [upscaleResponse.data.upscaledImageUrl] });

        } else {

            await interaction.editReply({ content: 'There was an issue processing your request.', ephemeral: true });

        }

    } catch (error) {

        console.error('Error upscaling image:', error);
        await interaction.editReply({ content: 'Failed to upscale image.', ephemeral: true });

    }
};

export default upscaleImage;
