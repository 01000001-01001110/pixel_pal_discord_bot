// varyImage.js
import axios from 'axios';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { AttachmentBuilder } from 'discord.js';

/**
 * Handles image variation with options for "slight" or "strong".
 * @param {Interaction} interaction Discord interaction.
 * @param {string} imageUrl URL of the image to vary.
 * @param {string} variationType Type of variation: "slight" or "strong".
 */
async function varyImage(interaction, imageUrl, variationType) {
    // Check if the interaction has not already been replied to or deferred
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
    }

    const formData = new FormData();
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    formData.append('input_image', buffer, { filename: 'image.jpg' });

    // Set the variation method based on user choice
    const uovMethod = variationType === 'slight' ? 'Vary (Subtle)' : 'Vary (Strong)';

    formData.append('uov_method', uovMethod);
    formData.append('performance_selection', 'Speed');
    formData.append('aspect_ratios_selection', '1152*896');
    formData.append('image_number', '1');
    formData.append('base_model_name', 'juggernautXL_version6Rundiffusion.safetensors');

    try {
        const { data } = await axios.post('http://127.0.0.1:8888/v1/generation/image-upscale-vary', formData, {
            headers: { ...formData.getHeaders(), 'Accept': 'application/json' },
        });

        if (data && data[0] && data[0].url) {
            const imageResponse = await fetch(data[0].url);
            const imageBuffer = await imageResponse.buffer();
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'varied-image.png' });

            await interaction.editReply({ content: 'Here is your varied image:', files: [attachment] });
        } else {
            await interaction.editReply('Failed to vary the image. Please check the input or try again later.');
        }
    } catch (error) {
        console.error('Error varying image:', error);
        await interaction.editReply('Failed to vary the image due to an error.');
    }
}

export { varyImage };
