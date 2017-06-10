const flags = ['two']
const permissions = ['one', 'apple', 'monkey']

console.log(permissions.some(flag => flags.includes(flag)))
