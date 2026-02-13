#!/bin/bash

# Test Runner Script for Net Worth Tracker
# This script provides convenient commands for running tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ] || [ ! -d "nw_tracker" ]; then
    print_error "Must be run from the backend directory"
    echo "Usage: cd backend && ./run_tests.sh [command]"
    exit 1
fi

# Default command
COMMAND=${1:-"all"}

case $COMMAND in
    all)
        print_status "Running all tests with coverage..."
        pytest --cov=nw_tracker --cov-report=term-missing --cov-report=html -v
        print_status "Coverage report generated: htmlcov/index.html"
        ;;

    unit)
        print_status "Running unit tests only..."
        pytest -m unit -v
        ;;

    integration)
        print_status "Running integration tests only..."
        pytest -m integration -v
        ;;

    coverage)
        print_status "Running tests with detailed coverage..."
        pytest --cov=nw_tracker --cov-report=term-missing --cov-report=html
        print_status "Opening coverage report..."
        open htmlcov/index.html 2>/dev/null || xdg-open htmlcov/index.html 2>/dev/null || echo "Coverage report: htmlcov/index.html"
        ;;

    fast)
        print_status "Running unit tests in parallel..."
        pytest -m unit -n auto -v
        ;;

    watch)
        print_status "Watching for changes and re-running tests..."
        if command -v pytest-watch &> /dev/null; then
            ptw
        else
            print_warning "pytest-watch not installed. Install with: pip install pytest-watch"
            exit 1
        fi
        ;;

    verbose)
        print_status "Running tests with verbose output..."
        pytest -v -s
        ;;

    debug)
        print_status "Running tests with debugger on failure..."
        pytest --pdb -v
        ;;

    file)
        if [ -z "$2" ]; then
            print_error "Please specify a test file"
            echo "Usage: ./run_tests.sh file <test_file_path>"
            exit 1
        fi
        print_status "Running specific test file: $2"
        pytest "$2" -v
        ;;

    function)
        if [ -z "$2" ]; then
            print_error "Please specify a test function"
            echo "Usage: ./run_tests.sh function <test_file_path>::<TestClass>::<test_function>"
            exit 1
        fi
        print_status "Running specific test function: $2"
        pytest "$2" -v -s
        ;;

    failed)
        print_status "Re-running failed tests from last run..."
        pytest --lf -v
        ;;

    coverage-check)
        print_status "Checking if coverage meets 80% threshold..."
        pytest --cov=nw_tracker --cov-fail-under=80 --cov-report=term-missing
        ;;

    clean)
        print_status "Cleaning up test artifacts..."
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
        find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
        find . -type f -name ".coverage" -exec rm -f {} + 2>/dev/null || true
        rm -rf .coverage htmlcov/ 2>/dev/null || true
        print_status "Clean complete"
        ;;

    help|*)
        echo "Net Worth Tracker Test Runner"
        echo ""
        echo "Usage: ./run_tests.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  all              Run all tests with coverage (default)"
        echo "  unit             Run unit tests only (mocked DB)"
        echo "  integration      Run integration tests only (SQLite DB)"
        echo "  coverage         Run tests and open coverage report in browser"
        echo "  fast             Run unit tests in parallel (faster)"
        echo "  watch            Watch for changes and re-run tests"
        echo "  verbose          Run tests with verbose output"
        echo "  debug            Run tests with debugger on failure"
        echo "  file <path>      Run specific test file"
        echo "  function <path>  Run specific test function"
        echo "  failed           Re-run failed tests from last run"
        echo "  coverage-check   Check if coverage meets 80% threshold"
        echo "  clean            Clean up test artifacts"
        echo "  help             Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh"
        echo "  ./run_tests.sh unit"
        echo "  ./run_tests.sh file tests/unit/auth/test_auth_service.py"
        echo "  ./run_tests.sh function tests/unit/auth/test_auth_service.py::TestAuthServicePasswordHandling::test_hash_password"
        echo "  ./run_tests.sh coverage"
        ;;
esac

exit 0
