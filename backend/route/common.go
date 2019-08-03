// Package route includes the route handlers for sd schedule planner
package route

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"database/sql"

	"github.com/ucsdscheduleplanner/UCSD-Schedule-Planner/backend/db"
)

// TODO: make this graceful, maybe an Env var or config
// set default quarter to SP19
const defaultQuarter = "SP19"

// HandlerFunc handles each route and returns *route.ErrorStruct, returns nil if no error
type HandlerFunc func(http.ResponseWriter, *http.Request, *db.DatabaseStruct) *ErrorStruct

// ErrorType error enum
type ErrorType int

// ErrorType error enum
const (
	_                    ErrorType = iota
	ErrHTTPMethodInvalid           // invalid http method
	ErrPostRead                    // http.post fail to read body
	ErrPostParse                   // http.post fail to parse post body as json
	ErrQuery                       // fail to query
	ErrQueryEmpty                  // query returns nothing
	ErrQueryScan                   // fail to scan sql.rows
	ErrResponseCreate              // fail to create the json response to return
	ErrResponseWrite               // fail to write the json to the http.ResponseWriter
	ErrInputMissing                // missing required arguments for query
)

// ErrorStruct stores information for an error
type ErrorStruct struct {
	Type  ErrorType
	Error error

	Query       string
	QueryParams []interface{}
	Status      int
	Missing     []string
	// Response    []byte
}

// MakeHandler creates closure for http handler func and handles the error
func MakeHandler(f HandlerFunc, ds *db.DatabaseStruct, tag string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Notes

		// Customized error: if specific error message needed, create a new error type and error with fmt.Errorf() etc.
		// Server-side error only: currently only log server-side error, i.e. no logs for invalid input and so on
		// More context in the future: the current logging logs the IP but it might not be enough for troubleshooting

		// Rule is to hide details from users but have detailed logs on the server

		if es := f(w, r, ds); es != nil {
			switch es.Type {
			case ErrHTTPMethodInvalid:
				http.Error(w, "Invalid method type", http.StatusMethodNotAllowed)
			case ErrPostRead:
				http.Error(w, "Error handling POST request", http.StatusBadRequest)
				log.Printf("%s Failed to read request to %q from %q: %v", tag, r.RequestURI, r.RemoteAddr, es.Error)
			case ErrPostParse:
				http.Error(w, "Failed to parse request", http.StatusInternalServerError)
				log.Printf("%s Failed to parse request to %q from %q: %v", tag, r.RequestURI, r.RemoteAddr, es.Error)
			case ErrQuery:
				http.Error(w, "Error query", http.StatusInternalServerError)
				log.Printf("%s Failed to query data requested by %q with %q and params %#v: %v", tag, r.RemoteAddr, es.Query, es.QueryParams, es.Error)
			case ErrQueryEmpty:
				http.Error(w, "Empty query", http.StatusNoContent)
				log.Printf("%s Empty query data requested by %q with %q and params %#v", tag, r.RemoteAddr, es.Query, es.QueryParams)
			case ErrQueryScan:
				http.Error(w, "Could not scan data", http.StatusInternalServerError)
				log.Printf("%s Failed to parse returned rows: %v", tag, es.Error)
			case ErrResponseCreate:
				http.Error(w, "Error creating the response JSON", http.StatusInternalServerError)
				log.Printf("%s Failed to create response JSON in response to %q: %v", tag, r.RemoteAddr, es.Error)
			case ErrResponseWrite:
				// TODO: log JSON content?
				http.Error(w, "Failed to send response", http.StatusInternalServerError)
				log.Printf("%s Failed to write data in response to %q: %v %v", tag, r.RemoteAddr, es.Status, es.Error)
			case ErrInputMissing:
				http.Error(w, fmt.Sprintf("Request does not contain necessary information: %#v", es.Missing), http.StatusBadRequest)
				// skip logging invalid request since it's not server-side error
			default:
				// ErrorType is not in the enum list, impossible
				http.Error(w, "Unsupported error type", http.StatusInternalServerError)
				log.Printf("%s Unsupported error type: %q from %q to %q", tag, es.Type, r.RemoteAddr, r.RequestURI)
			}
		}
	}
}

// RowScanner scan *sql.Rows and return requested values
// Might consider sql.Scanner but here a lambda is easier
type RowScanner func(*sql.Rows) (val interface{}, err error)

// QueryStruct stores information for query
type QueryStruct struct {
	RowScanner  RowScanner
	Query       string
	QueryTable  string
	QueryParams []interface{}
}

// 1. query using ds
// 2. process rows using RowScanner
func query(ds *db.DatabaseStruct, qs QueryStruct) ([]interface{}, *ErrorStruct) {

	rows, err := ds.Query(qs.QueryTable, qs.Query, qs.QueryParams...)

	if err != nil {
		return nil, &ErrorStruct{Type: ErrQuery, Error: err, Query: qs.Query, QueryParams: qs.QueryParams}
	}

	if rows == nil {
		return nil, &ErrorStruct{Type: ErrQueryEmpty, Query: qs.Query, QueryParams: qs.QueryParams}
	}

	var res []interface{}

	for rows.Next() {
		row, err := qs.RowScanner(rows)

		// TODO: might consider try again here
		if err != nil {
			return nil, &ErrorStruct{Type: ErrQueryScan, Error: err}
		}

		res = append(res, row)
	}

	return res, nil
}

func response(w http.ResponseWriter, r *http.Request, res interface{}) *ErrorStruct {
	resJSON, err := json.Marshal(res)

	if err != nil {
		return &ErrorStruct{Type: ErrResponseCreate, Error: err}
	}

	status, err := w.Write(resJSON)

	if err != nil {
		return &ErrorStruct{Type: ErrResponseWrite, Error: err, Status: status}
	}

	return nil
}

// RowScannerOneString scans one sql row and return as single string
func RowScannerOneString(rows *sql.Rows) (interface{}, error) {
	var val string
	err := rows.Scan(&val)
	return val, err
}

// readURLQuery returns a map of queries and a slice of missing ones
func readURLQuery(request *http.Request, args []string) (ans map[string]string, missing []string) {
	ans = make(map[string]string)
	for _, s := range args {
		keys, ok := request.URL.Query()[s]
		if !ok || len(keys[0]) < 1 {
			missing = append(missing, s)
		} else {
			ans[s] = keys[0]
		}
	}
	return // named return
}

func readURLQueryDeptCourseNumQuarter(request *http.Request) (string, string, string, []string) {
	ans, missing := readURLQuery(request, []string{"department", "quarter", "courseNum"})
	return ans["department"], ans["courseNum"], ans["quarter"], missing
}

func readURLQueryDeptQuarter(request *http.Request) (string, string, []string) {
	ans, missing := readURLQuery(request, []string{"department", "quarter"})
	return ans["department"], ans["quarter"], missing
}