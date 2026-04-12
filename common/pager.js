const _ = require("lodash")
function getPaginatedItems(items, {
    _page,
    _pageSize,
    _per_page
}) {
    const page = parseInt(_page, 10);
    const pageSize = parseInt(_pageSize || _per_page, 10);
    var pg = Number.isFinite(page) && page > 0 ? page : 1,
        pgSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : items.length,
        offset = (pg - 1) * pgSize,
        pagedItems = _.drop(items, offset).slice(0, pgSize);
    return pagedItems;
}






module.exports = {
    getPaginatedItems,
}
