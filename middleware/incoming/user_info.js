const addUserInfoToUpdate = function addUserInfoToUpdate(bot, update, next) {
  bot.getUserInfo(update.sender.id)

  .then((userInfo) => {
    if (update.session.context) {
        update.session.context.userInfo = userInfo;
        update.session.context.firstname = userInfo.first_name;
    }

    next(); // next is only called once the user information is gathered
  });
}

module.exports = {
  addUserInfoToUpdate
}
