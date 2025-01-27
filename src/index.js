var Vec3 = require('Vec3');
const {
  RaycastIterator
} = require('prismarine-world').iterators

module.exports = async function(bot) {

  bot.autoclicker = { running: false };

  bot.autoclicker.interval = null // Do not interact with manually, used to store the interval ID

  bot.autoclicker.options = {
    max_distance: 3.5, // Max distance to hit entities (Default: 3.5)
    swing_through: ['experience_orb'], // Hit through entities (Default: ['experience_orb'])
    blacklist: ['player'], // Do not hit certain entities (Default: ['player'])
    stop_on_window: true, // Stop if a window is opened (Default: true)
    always_swing: true, // Always swing, even if there is no entity (Default: true)
    delay: 1500,
  }

  bot.autoclicker.start = function() {
    if (bot.autoclicker.interval) return;
    bot.autoclicker.interval = setInterval(async function() {
      let entity = entityAtCursor(bot.autoclicker.options.max_distance, bot.autoclicker.options.swing_through);
      if(bot.autoclicker.options.stop_on_window && bot.currentWindow) return;
      if (!entity || bot.autoclicker.options.blacklist.includes(entity.name)) {
          return bot.autoclicker.options.always_swing ? bot.swingArm() : null;
      }
      bot.attack(entity, true);
    }, bot.autoclicker.options.delay);
    bot.autoclicker.running = true;
  }

  bot.autoclicker.stop = function() {
    bot.autoclicker.running = false;
    bot.autoclicker.interval = clearInterval(bot.autoclicker.interval);
  }

  // swing_through - Can be used for entities such as an experience_orb, that has an empty collision box
    function entityAtCursor(maxDistance = 3.5, swing_through = ['experience_orb']) {
      const block = bot.blockAtCursor(maxDistance)
      maxDistance = block ?.intersect.distanceTo(bot.entity.position)??maxDistance

      const entities = Object.values(bot.entities)
        .filter(entity => entity.type !== 'object' && entity.username !== bot.username && entity.position.distanceTo(bot.entity.position) <= maxDistance && !swing_through.includes(entity.name))

      const dir = new Vec3(-Math.sin(bot.entity.yaw) * Math.cos(bot.entity.pitch), Math.sin(bot.entity.pitch), -Math.cos(bot.entity.yaw) * Math.cos(bot.entity.pitch))
      const iterator = new RaycastIterator(bot.entity.position.offset(0, bot.entity.height, 0), dir.normalize(), maxDistance)

      let targetEntity = null
      let targetDist = maxDistance

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]
        const w = entity.width / 2

        const shapes = [
          [-w, 0, -w, w, entity.height + (entity.type === 'player' ? 0.18 : 0), w]
        ]
        const intersect = iterator.intersect(shapes, entity.position)
        if (intersect) {
          const entityDir = entity.position.minus(bot.entity.position) // Can be combined into 1 line
          const sign = Math.sign(entityDir.dot(dir))
          if (sign !== -1) {
            const dist = bot.entity.position.distanceTo(intersect.pos)
            if (dist < targetDist) {
              targetEntity = entity
              targetDist = dist
            }
          }
        }
      }

      return targetEntity
    }

}
