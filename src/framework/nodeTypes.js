/**
 * EssentialBoardOS - Node Type Definitions
 * 블루프린트 스타일 노드 타입 정의
 * 
 * Pin Types:
 *   - exec: 실행 흐름 (▶)
 *   - string: 문자열 (●)
 *   - number: 숫자 (●)
 *   - boolean: 불린 (●)
 *   - any: 모든 타입 (●)
 */

/* ── Pin Type Colors ── */
export const PIN_COLORS = {
    exec: '#e8e6f0',
    string: '#fdcb6e',
    number: '#74b9ff',
    boolean: '#ff6b6b',
    any: '#a29bfe',
    list: '#55efc4',
}

/* ── Node Categories ── */
export const NODE_CATEGORIES = {
    EVENT: { id: 'event', label: '이벤트', color: '#ff6b6b', icon: '⚡' },
    ACTION: { id: 'action', label: '액션', color: '#00ce9a', icon: '▶' },
    DATA: { id: 'data', label: '데이터', color: '#fdcb6e', icon: '📦' },
    LOGIC: { id: 'logic', label: '로직', color: '#74b9ff', icon: '🔀' },
    FUNCTION: { id: 'function', label: '함수', color: '#fd79a8', icon: '🔧' },
    STORAGE: { id: 'storage', label: '저장소', color: '#e17055', icon: '💾' },
    HARDWARE: { id: 'hardware', label: '하드웨어', color: '#00b894', icon: '📱' },
    API: { id: 'api', label: 'API', color: '#a29bfe', icon: '🌐' },
}

/* ── Node Type Definitions ── */
export const NODE_TYPES = {
    // ═══ EVENT NODES ═══
    onAppStart: {
        type: 'onAppStart',
        category: 'event',
        label: '앱 시작',
        description: '앱이 시작될 때 실행',
        inputs: [],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {},
    },

    onClick: {
        type: 'onClick',
        category: 'event',
        label: '클릭 이벤트',
        description: 'UI 컴포넌트 클릭 시 실행',
        inputs: [],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            targetId: { type: 'string', label: '대상 컴포넌트', default: '' },
        },
    },

    onKeyPress: {
        type: 'onKeyPress',
        category: 'event',
        label: '키 입력 이벤트',
        description: '특정 키 입력 시 실행',
        inputs: [],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'key', label: '키', type: 'string' },
        ],
        properties: {
            key: { type: 'string', label: '키', default: '' },
        },
    },

    onTimer: {
        type: 'onTimer',
        category: 'event',
        label: '타이머',
        description: '일정 간격으로 반복 실행',
        inputs: [],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            interval: { type: 'number', label: '간격 (ms)', default: 1000 },
            repeat: { type: 'boolean', label: '반복', default: true },
        },
    },

    // ═══ ACTION NODES ═══
    setText: {
        type: 'setText',
        category: 'action',
        label: '텍스트 변경',
        description: 'UI 컴포넌트의 텍스트를 변경',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '값', type: 'string' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            targetId: { type: 'string', label: '대상 컴포넌트', default: '' },
        },
    },

    setStyle: {
        type: 'setStyle',
        category: 'action',
        label: '스타일 변경',
        description: 'UI 컴포넌트의 스타일을 변경',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '값', type: 'string' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            targetId: { type: 'string', label: '대상 컴포넌트', default: '' },
            property: { type: 'string', label: 'CSS 속성', default: 'color' },
        },
    },

    showAlert: {
        type: 'showAlert',
        category: 'action',
        label: '알림 표시',
        description: '알림 메시지를 표시',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'message', label: '메시지', type: 'string' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {},
    },

    log: {
        type: 'log',
        category: 'action',
        label: '로그 출력',
        description: '콘솔에 로그를 출력',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'message', label: '메시지', type: 'any' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {},
    },

    setVariable: {
        type: 'setVariable',
        category: 'action',
        label: '변수 설정',
        description: '변수에 값을 저장',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '값', type: 'any' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            varName: { type: 'string', label: '변수명', default: 'myVar' },
        },
    },

    // ═══ DATA NODES ═══
    stringLiteral: {
        type: 'stringLiteral',
        category: 'data',
        label: '문자열',
        description: '문자열 상수값',
        inputs: [],
        outputs: [
            { id: 'value', label: '값', type: 'string' },
        ],
        properties: {
            value: { type: 'string', label: '값', default: 'Hello' },
        },
    },

    numberLiteral: {
        type: 'numberLiteral',
        category: 'data',
        label: '숫자',
        description: '숫자 상수값',
        inputs: [],
        outputs: [
            { id: 'value', label: '값', type: 'number' },
        ],
        properties: {
            value: { type: 'number', label: '값', default: 0 },
        },
    },

    getVariable: {
        type: 'getVariable',
        category: 'data',
        label: '변수 가져오기',
        description: '저장된 변수 값을 가져옴',
        inputs: [],
        outputs: [
            { id: 'value', label: '값', type: 'any' },
        ],
        properties: {
            varName: { type: 'string', label: '변수명', default: 'myVar' },
        },
    },

    concat: {
        type: 'concat',
        category: 'data',
        label: '문자열 합치기',
        description: '두 문자열을 합침',
        inputs: [
            { id: 'a', label: 'A', type: 'string' },
            { id: 'b', label: 'B', type: 'string' },
        ],
        outputs: [
            { id: 'value', label: '결과', type: 'string' },
        ],
        properties: {},
    },

    mathOp: {
        type: 'mathOp',
        category: 'data',
        label: '수학 연산',
        description: '두 숫자의 연산',
        inputs: [
            { id: 'a', label: 'A', type: 'number' },
            { id: 'b', label: 'B', type: 'number' },
        ],
        outputs: [
            { id: 'value', label: '결과', type: 'number' },
        ],
        properties: {
            operator: { type: 'select', label: '연산', default: '+', options: ['+', '-', '*', '/'] },
        },
    },

    getInputValue: {
        type: 'getInputValue',
        category: 'data',
        label: '입력값 가져오기',
        description: 'UI 입력창의 값을 가져옴',
        inputs: [],
        outputs: [
            { id: 'value', label: '값', type: 'string' },
        ],
        properties: {
            targetId: { type: 'string', label: '대상 컴포넌트', default: '' },
        },
    },

    // ═══ LOGIC NODES ═══
    ifCondition: {
        type: 'ifCondition',
        category: 'logic',
        label: '조건문 (If)',
        description: '조건에 따라 분기',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'condition', label: '조건', type: 'boolean' },
        ],
        outputs: [
            { id: 'true', label: 'True', type: 'exec' },
            { id: 'false', label: 'False', type: 'exec' },
        ],
        properties: {},
    },

    compare: {
        type: 'compare',
        category: 'logic',
        label: '비교',
        description: '두 값을 비교',
        inputs: [
            { id: 'a', label: 'A', type: 'any' },
            { id: 'b', label: 'B', type: 'any' },
        ],
        outputs: [
            { id: 'result', label: '결과', type: 'boolean' },
        ],
        properties: {
            operator: { type: 'select', label: '연산자', default: '==', options: ['==', '!=', '>', '<', '>=', '<='] },
        },
    },

    not: {
        type: 'not',
        category: 'logic',
        label: 'NOT',
        description: '불린값 반전',
        inputs: [
            { id: 'value', label: '값', type: 'boolean' },
        ],
        outputs: [
            { id: 'result', label: '결과', type: 'boolean' },
        ],
        properties: {},
    },

    // ═══ DATA NODES (Extended) ═══
    createList: {
        type: 'createList',
        category: 'data',
        label: '리스트 생성',
        description: '빈 리스트를 생성합니다',
        inputs: [],
        outputs: [
            { id: 'value', label: '리스트', type: 'list' },
        ],
        properties: {},
    },

    listAdd: {
        type: 'listAdd',
        category: 'data',
        label: '리스트 추가',
        description: '리스트에 항목을 추가합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'list', label: '리스트', type: 'list' },
            { id: 'item', label: '항목', type: 'any' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '결과', type: 'list' },
        ],
        properties: {},
    },

    listGet: {
        type: 'listGet',
        category: 'data',
        label: '리스트 가져오기',
        description: '인덱스로 항목을 가져옵니다',
        inputs: [
            { id: 'list', label: '리스트', type: 'list' },
            { id: 'index', label: '인덱스', type: 'number' },
        ],
        outputs: [
            { id: 'value', label: '값', type: 'any' },
        ],
        properties: {},
    },

    listRemove: {
        type: 'listRemove',
        category: 'data',
        label: '리스트 제거',
        description: '인덱스의 항목을 제거합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'list', label: '리스트', type: 'list' },
            { id: 'index', label: '인덱스', type: 'number' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '결과', type: 'list' },
        ],
        properties: {},
    },

    listLength: {
        type: 'listLength',
        category: 'data',
        label: '리스트 길이',
        description: '리스트의 항목 수를 반환합니다',
        inputs: [
            { id: 'list', label: '리스트', type: 'list' },
        ],
        outputs: [
            { id: 'value', label: '길이', type: 'number' },
        ],
        properties: {},
    },

    toNumber: {
        type: 'toNumber',
        category: 'data',
        label: '숫자 변환',
        description: '값을 숫자로 변환합니다',
        inputs: [
            { id: 'value', label: '값', type: 'any' },
        ],
        outputs: [
            { id: 'value', label: '숫자', type: 'number' },
        ],
        properties: {},
    },

    toString: {
        type: 'toString',
        category: 'data',
        label: '문자열 변환',
        description: '값을 문자열로 변환합니다',
        inputs: [
            { id: 'value', label: '값', type: 'any' },
        ],
        outputs: [
            { id: 'value', label: '문자열', type: 'string' },
        ],
        properties: {},
    },

    randomNumber: {
        type: 'randomNumber',
        category: 'data',
        label: '랜덤 숫자',
        description: '범위 내 랜덤 숫자를 생성합니다',
        inputs: [],
        outputs: [
            { id: 'value', label: '값', type: 'number' },
        ],
        properties: {
            min: { type: 'number', label: '최소', default: 0 },
            max: { type: 'number', label: '최대', default: 100 },
            integer: { type: 'boolean', label: '정수만', default: true },
        },
    },

    // ═══ LOGIC NODES (Extended) ═══
    forLoop: {
        type: 'forLoop',
        category: 'logic',
        label: '반복문 (For)',
        description: '지정된 횟수만큼 반복 실행합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'start', label: '시작', type: 'number' },
            { id: 'end', label: '끝', type: 'number' },
        ],
        outputs: [
            { id: 'loop', label: '반복', type: 'exec' },
            { id: 'done', label: '완료', type: 'exec' },
            { id: 'index', label: '인덱스', type: 'number' },
        ],
        properties: {},
    },

    whileLoop: {
        type: 'whileLoop',
        category: 'logic',
        label: '반복문 (While)',
        description: '조건이 참인 동안 반복합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'condition', label: '조건', type: 'boolean' },
        ],
        outputs: [
            { id: 'loop', label: '반복', type: 'exec' },
            { id: 'done', label: '완료', type: 'exec' },
        ],
        properties: {
            maxIterations: { type: 'number', label: '최대 반복', default: 1000 },
        },
    },

    andOr: {
        type: 'andOr',
        category: 'logic',
        label: 'AND / OR',
        description: '논리 연산을 수행합니다',
        inputs: [
            { id: 'a', label: 'A', type: 'boolean' },
            { id: 'b', label: 'B', type: 'boolean' },
        ],
        outputs: [
            { id: 'result', label: '결과', type: 'boolean' },
        ],
        properties: {
            operator: { type: 'select', label: '연산', default: 'AND', options: ['AND', 'OR'] },
        },
    },

    // ═══ STORAGE NODES ═══
    saveData: {
        type: 'saveData',
        category: 'storage',
        label: '데이터 저장',
        description: 'localStorage에 키-값을 저장합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '값', type: 'any' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            key: { type: 'string', label: '키', default: 'myKey' },
        },
    },

    loadData: {
        type: 'loadData',
        category: 'storage',
        label: '데이터 불러오기',
        description: 'localStorage에서 값을 불러옵니다',
        inputs: [],
        outputs: [
            { id: 'value', label: '값', type: 'any' },
        ],
        properties: {
            key: { type: 'string', label: '키', default: 'myKey' },
        },
    },

    deleteData: {
        type: 'deleteData',
        category: 'storage',
        label: '데이터 삭제',
        description: 'localStorage에서 키를 삭제합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            key: { type: 'string', label: '키', default: 'myKey' },
        },
    },

    // ═══ HARDWARE NODES ═══
    getClipboard: {
        type: 'getClipboard',
        category: 'hardware',
        label: '클립보드 읽기',
        description: '클립보드 텍스트를 읽어옵니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '텍스트', type: 'string' },
        ],
        properties: {},
    },

    setClipboard: {
        type: 'setClipboard',
        category: 'hardware',
        label: '클립보드 복사',
        description: '텍스트를 클립보드에 복사합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '텍스트', type: 'string' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {},
    },

    getLocation: {
        type: 'getLocation',
        category: 'hardware',
        label: 'GPS 위치',
        description: '현재 GPS 위치를 가져옵니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'lat', label: '위도', type: 'number' },
            { id: 'lon', label: '경도', type: 'number' },
        ],
        properties: {},
    },

    getBattery: {
        type: 'getBattery',
        category: 'hardware',
        label: '배터리 정보',
        description: '배터리 잔량 정보를 가져옵니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'level', label: '잔량 (%)', type: 'number' },
            { id: 'charging', label: '충전중', type: 'boolean' },
        ],
        properties: {},
    },

    sendNotification: {
        type: 'sendNotification',
        category: 'hardware',
        label: '알림 보내기',
        description: '브라우저 알림을 보냅니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'body', label: '내용', type: 'string' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            title: { type: 'string', label: '제목', default: 'EssentialBoardOS' },
        },
    },

    // ═══ API NODES ═══
    geminiChat: {
        type: 'geminiChat',
        category: 'api',
        label: '제미나이 챗',
        description: 'Gemini API 호출 (백엔드 필요)',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'prompt', label: '프롬프트', type: 'string' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'response', label: '응답', type: 'string' },
        ],
        properties: {
            template: { type: 'string', label: '템플릿', default: '' },
        },
    },

    httpRequest: {
        type: 'httpRequest',
        category: 'api',
        label: 'HTTP 요청',
        description: '외부 API에 HTTP 요청 (백엔드 프록시)',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'url', label: 'URL', type: 'string' },
            { id: 'body', label: 'Body', type: 'string' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'execError', label: '에러', type: 'exec' },
            { id: 'data', label: '응답 데이터', type: 'any' },
            { id: 'status', label: '상태코드', type: 'number' },
        ],
        properties: {
            method: { type: 'select', label: '메서드', default: 'GET', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
            jsonPath: { type: 'string', label: 'JSON 경로', default: '' },
            headers: { type: 'string', label: '헤더 (JSON)', default: '{}' },
        },
    },

    // ═══ FUNCTION NODES ═══
    functionDefine: {
        type: 'functionDefine',
        category: 'function',
        label: '함수 정의',
        description: '재사용 가능한 함수를 정의합니다',
        inputs: [],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'param1', label: '매개변수 1', type: 'any' },
            { id: 'param2', label: '매개변수 2', type: 'any' },
        ],
        properties: {
            funcName: { type: 'string', label: '함수 이름', default: 'myFunction' },
        },
    },

    functionReturn: {
        type: 'functionReturn',
        category: 'function',
        label: '함수 반환',
        description: '함수 실행 결과를 반환합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'value', label: '반환값', type: 'any' },
        ],
        outputs: [],
        properties: {},
    },

    functionCall: {
        type: 'functionCall',
        category: 'function',
        label: '함수 호출',
        description: '정의된 함수를 호출합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'param1', label: '매개변수 1', type: 'any' },
            { id: 'param2', label: '매개변수 2', type: 'any' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
            { id: 'result', label: '결과', type: 'any' },
        ],
        properties: {
            funcName: { type: 'string', label: '함수 이름', default: 'myFunction' },
        },
    },

    // ═══ NAVIGATION ═══
    navigatePage: {
        type: 'navigatePage',
        category: 'action',
        label: '페이지 이동',
        description: 'UI 페이지를 전환합니다',
        inputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        outputs: [
            { id: 'exec', label: '', type: 'exec' },
        ],
        properties: {
            pageId: { type: 'string', label: '페이지 ID', default: 'page_0' },
        },
    },
}

/* ── Helper: Create a new node instance ── */
let nodeIdCounter = 0
export function createNodeInstance(type, x = 0, y = 0) {
    const def = NODE_TYPES[type]
    if (!def) return null

    const id = `node_${Date.now()}_${nodeIdCounter++}`
    const properties = {}

    // Initialize properties with defaults
    Object.entries(def.properties).forEach(([key, prop]) => {
        properties[key] = prop.default
    })

    return {
        id,
        type: def.type,
        x,
        y,
        properties,
    }
}

/* ── Helper: Get node definition ── */
export function getNodeDef(type) {
    return NODE_TYPES[type] || null
}

/* ── Helper: Get category info ── */
export function getCategoryInfo(categoryId) {
    return Object.values(NODE_CATEGORIES).find(c => c.id === categoryId) || null
}

/* ── Group node types by category ── */
export function getNodeTypesByCategory() {
    const grouped = {}
    Object.values(NODE_TYPES).forEach(node => {
        if (!grouped[node.category]) grouped[node.category] = []
        grouped[node.category].push(node)
    })
    return grouped
}
