const _ = require("lodash")
function getPaginatedItems(items, {
    _page,
    _pageSize
}) {
    var pg = _page || 1,
        pgSize = _pageSize || items.length,
        offset = (pg - 1) * pgSize,
        pagedItems = _.drop(items, offset).slice(0, pgSize);
    return pagedItems;
}


module.exports = {
    getPaginatedItems
}