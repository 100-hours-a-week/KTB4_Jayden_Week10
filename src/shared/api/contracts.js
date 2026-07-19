export class ApiContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiContractError';
  }
}

export function requireRecord(value, contractName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiContractError(`${contractName} 응답이 객체 형식이 아닙니다.`);
  }
  return value;
}

export function requireArray(value, contractName) {
  if (!Array.isArray(value)) {
    throw new ApiContractError(`${contractName} 응답이 배열 형식이 아닙니다.`);
  }
  return value;
}

export function requireId(record, fieldName, contractName) {
  const value = record?.[fieldName];
  if (value === undefined || value === null || value === '') {
    throw new ApiContractError(`${contractName} 응답에 ${fieldName}가 없습니다.`);
  }
  return value;
}
