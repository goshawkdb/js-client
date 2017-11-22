const test = require("ava")
const Ref = require("../../src/ref")

test("Check that I can increment a Uint64 loaded from a buffer", t => {
	const ref1 = Ref.fromMessage({
		VarId: Uint8Array.from([1, 2, 3]),
		Capability: { Read: true, Write: false }
	})
	const ref2 = Ref.fromMessage({
		VarId: Uint8Array.from([1, 2, 3]),
		Capability: { Read: true, Write: false }
	})
	const ref3 = Ref.fromMessage({
		VarId: Uint8Array.from([1, 9, 3]),
		Capability: { Read: true, Write: false }
	})
	const ref4 = Ref.fromMessage({
		VarId: Uint8Array.from([1, 2, 3]),
		Capability: { Read: false, Write: true }
	})

	t.true(ref1.sameReferent(ref2))
	t.true(ref2.sameReferent(ref1))
	t.true(!ref1.sameReferent(ref3))
	t.true(ref1.sameReferent(ref4))
})
