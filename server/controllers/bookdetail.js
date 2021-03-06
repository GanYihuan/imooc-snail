const { mysql } = require('../qcloud')

module.exports = async ctx => {
  /* 前端发过来的 id */
  const { id } = ctx.request.query
  /* first: 数据是数组只有一个元素, 使其返回第一个元素 */
  const detail = await mysql('books')
    .select('books.*', 'cSessionInfo.user_info')
    .join('cSessionInfo', 'books.openid', 'cSessionInfo.open_id')
    .where('id', id)
    .first()
  console.log(detail)
  /* JSON.parse(): string 转换为 json */
  const info = JSON.parse(detail.user_info)
  /* 返回 */
  ctx.state.data = Object.assign({}, detail, {
    tags: detail.tags.split(','),
    summary: detail.summary.split('\n'),
    user_info: {
      name: info.nickName,
      image: info.avatarUrl
    }
  })
  /* increment: 累加 */
  await mysql('books')
    .where('id', id)
    .increment('count', 1)
}
