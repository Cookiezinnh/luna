const Hmtai = require('hmtai');
const hmtai = new Hmtai();

module.exports = {
    name: 'bonk',
    commandAlias: ['bonk-gif', 'animebonk'],
    description: 'Sends an animated gif of a bonk!',
    requiredRoles: [],
    async execute(message, args) {
        try {
            const image = await hmtai.sfw.bonk();
            await message.channel.send(image);
        } catch (error) {
            console.error('Error fetching image from hmtai:', error);
            await message.reply('❌ An error occurred while fetching the image. Please try again later.');
        }
    },
};