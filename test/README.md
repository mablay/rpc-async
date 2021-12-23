# Test

What should be tested?

 * notification | success
 * notification | LocalEncodingError
 * notification | TransportRequestError
 * request      | success
 * request      | RequestTimeout
 * request      | LocalEncodingError
 * request      | TransportRequestError
 * request      | RemoteDecodingError
 * request      | RemoteHandlerNotFoundError
 * request      | RemoteExecutionError
 * request      | RemoteEncodingError
 * request      | TransportResponseError - communicating the error will probably also fail
 * request      | LocalDecodingError
 * request      | ResponseMappingError
 * handle       | InvalidArgumentsError
 * constructor  | InvalidArgumentsError
 * constructor  | InvalidArgumentsError
