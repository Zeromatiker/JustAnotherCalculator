"use strict"

//---------- constructor ----------
function Calc(){}


{//script start
let c = Calc.prototype


//---------- helper functions ----------
c.newConst = function(name, value){
	Object.defineProperty(this, name, { value: value })
}

// error message; this[i] is extra arg i
let Error = function(err, ...args){
	this.toString = ()=>err
	args.forEach( (x,i) => this[i] = x )
}
//---------- helper functions end ----------


//---------- basic property definitions ----------
c.history = []
c.definitions = []
// operators
c.newConst( 'operatorList', [ '=', ',', '<==>', '==', '<=', '>=', '<', '>', '+', '-', '*', '/', '^' ] )
c.newConst( 'operatorPriority', [
	['='],
	[','],
	['<==>'],
	['==','<=','>=','<','>'], 
	['+','-'],
	['*','/'],
	['^']
])

c.newConst( 'allowedOperatorChars', c.operatorList.join``.split``.filter((x,i,a)=>a.indexOf(x)===i).map(x=>'\\'+x).join`` )
// brackets
c.newConst( 'bracketList', '(){}[]|'.split`` )
c.newConst( 'allowedBracketChars', c.bracketList.map( x => '\\'+x ).join`` )
// illegal chars
c.newConst( 'illegalChars', new RegExp(`[^ \\w.${c.allowedOperatorChars+c.allowedBracketChars}]`) )
//---------- basic property definitions end ----------


//---------- "public" functions ----------
c.onDefinitionChange = function(){}
//---------- "public" functions end ----------


//---------- init ----------
c.init = function(){
	this.onDefinitionChange(this.definitions)
}

c.reset = function(){
	this.history = []
	this.definitions = []
	this.init()
}
//---------- init end ----------


//---------- input/output ----------
c.input = function(inp, really) {
	if( really && inp !== this.history[0] ) this.history.unshift(inp)
	this.validateInput(inp)
	inp = this.output( this.calc( this.parse( inp.trim() ) ) )
	return inp
}

c.validateInput = function(x){
	x = x.trim()
	if( !x ) throw 'noInput'
	if( c.illegalChars.test(x) ) throw 'illegalChar'
}

c.output = function(x){
	return x+''
	//return x.map( a => a+'' ).join` `
}
//---------- input/output end ----------


//---------- parse ----------
c.parse = function(inp){
	return c.parse3( c.parse2( c.parse1(inp) ) )
}

// string => object-array
c.parse1 = function(inp){
	let result = []

	outerloop:
	while(inp){
		for(let i=0; i<c.parse1obj.length; i++){
			let tmp = inp.split( c.parse1obj[i][0] ) 
			if(tmp.length > 1){
				inp = tmp[2]
				result.push( c.parse1obj[i][1](tmp[1]) )
				continue outerloop
			} 
		}
		inp = inp.substr(1)
	}

	return result
}
c.newConst( 'parse1obj', [
	[ /^(\d+\.\d+|\.\d+|\d+)/, x => new c.o.number(+x) ],
	[ /^([a-zA-Z](?:\w+)?)/, x => new c.o.var(x) ],
	[ new RegExp( `^(${c.operatorList.map(x=>x.split``.map(x=>'\\'+x).join``).join`|`})` ), x => new c.o.operator(x) ],
	[ new RegExp( `^(${c.bracketList.map(x=>'\\'+x).join`|`})` ), x => new c.o.bracketLike(x) ]
])

// obj-array => tree of bracketLike-objects
c.parse2 = function(inp){
	let result = new c.o.bracketLike('(')
	let brackets = []

	inp.forEach( x => {
		if(x.type === 'bracket'){
			// bracket closed
			if( brackets[0] && brackets[0].inside.bracketType === {
				'(': ')',
				'{': '}',
				'[': ']',
				'|': '|'
			}[ x.bracketType ] ){
				brackets.shift()
			// bracket opened
			} else if( '([{|'.search('\\'+x.bracketType) > -1 ){
				(brackets[0]||result).inside.push(x)
				brackets.unshift(x)
			// wrong bracket closed
			} else throw 'bracketFail'
		} else {
			(brackets[0]||result).inside.push(x)
		}
	} )

	// bracket not closed
	if(brackets.length) throw 'bracketNotClosed'

	return result
}

// tree of bracketLike-objects => 
c.parse3 = function(inp){
	return inp

	

	function makeCalcObj( oprator, objects ){
		// search for operator with lowest priority, split the object-array at that position and 
		// ... return an operator containing the split-result
		for(let i=0; i < c.operatorPriority.length ; i++){
			// operator with current prioritiy i found
			if( inp.findIndex( x => x.type==='operator' && c.operatorPriority[i].indexOf(x.value)!==-1 ) !== -1 ){
				return new c.op[op](...objects)
			}
		}
	}


}
//---------- parse end ----------

//---------- calc ----------
c.calc = function(x){
	console.log(x)
	return x
}
//---------- calc end ----------


//---------- Objects ----------
c.o = {}
c.o.number = function(x){
	this.type = 'number'
	this.value = +x //convert possible object to number
	this.toString = function(){
		return this.value+''
	}
	this.valueOf = function(){
		return this.value
	}
}
c.o.operator = function(x){
	this.type = 'operator'
	this.value = typeof x === 'string' ? x : (x.type === 'operator' ? x.value : '')
	if(c.operatorList.indexOf(this.value) === -1) throw 'unknownOperator'
	this.toString = function(){
		return this.value
	}
}
c.o.bracketLike = function(x,inside=[]){
	this.type = 'bracket'
	this.bracketType = typeof x === 'string' ? x : (x.type === 'bracket' ? x.bracketType : '')
	if(c.bracketList.indexOf(this.bracketType) === -1) throw 'unknownBracket'
	this.inside = inside
	this.toString = function(){
		return this.inside.length ?
			this.bracketType+' ' +
			this.inside.join(' ')+' ' +
			{ '(':')', '{':'}', '[':']', '|':'|' }[ this.bracketType ]
			:
			''
	}
}
c.o.var = function(x){
	this.type = 'var'
	this.value = typeof x === 'string' ? x : (x.type === 'var' ? x.value : '')
	this.toString = function(){
		return this.value
	}
}
//---------- Objects end ----------


//---------- Operators ----------

let opProto = function(){
	this.type = 'operatorFunc'
	this.operator = ''
	this.args = []
	this.calc = function(){}
	this.toString = function(){
		return this.args.join( ' '+this.operator+' ' )
	}
}

let newOpObj = op => {
	let newObj = function(...args){
		this.args = args
	}
	newObj.prototype = Object.create(opProto.prototype)
	newObj.prototype.constructor = newObj
	newObj.prototype.op = op
	return newObj
}

let calcFuns = {
	'=': (args)=>{
		return
	},
	',': (args)=>{
		return
	},
	'<==>': (args)=>{
		return
	},
	'==': (args)=>{
		return
	},
	'<=': (args)=>{
		return
	},
	'>=': (args)=>{
		return
	},
	'<': (args)=>{
		return
	},
	'>': (args)=>{
		return
	},
	'+': (args)=>{
		if(args.every( x => x.type === 'number' ))
			return new c.o.number(args.reduce( (a,b) => a+b ))
	},
	'-': (args)=>{
		if(args.every( x => x.type === 'number' ))
			return new c.o.number(args.reduce( (a,b) => a-b ))	
	},
	'*': (args)=>{
		if(args.every( x => x.type === 'number' ))
			return new c.o.number(args.reduce( (a,b) => a*b ))
	},
	'/': (args)=>{
		if(args.every( x => x.type === 'number' ))
			return new c.o.number(args.reduce( (a,b) => a/b ))
	},
	'^': (args)=>{
		console.log(args)
		if(args.every( x => x.type === 'number' ))
			// a^(b^(c^(...)))
			return new c.o.number(args.reverse().reduce( (exp,base) => base**exp, 1 ) )
	}
}

// create objects for all operators
c.op = {}
c.operatorList.forEach( op => c.op[op] = newOpObj(op) )
// add calc functions to all operators
Object.keys(calcFuns).forEach( key => c.op[key].prototype.calc =
	function(){ return calcFuns[key](this.args) || new Error('unsupportedOperation', key) }
)

//---------- Operators end ----------


}//script end