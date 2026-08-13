import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";

import Home from "./page";

global.fetch = jest.fn((url, options) =>
  Promise.resolve({
    ok: true,
    status: options?.method === "POST" ? 201 : 200,
    json: async () =>
      options?.method === "POST"
        ? {
            _id: "test-id",
            title: "Test Task",
            status: "Pending",
          }
        : [],
  })
) as jest.Mock;

test("renders Sprint 11 heading", async () => {
  render(<Home />);

  expect(
    screen.getByText("Sprint 11 - Component Testing")
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});

test("submits new data", async () => {
  render(<Home />);

  const titleInput = screen.getByPlaceholderText("Title");
  const statusInput = screen.getByPlaceholderText("Status");
  const addButton = screen.getByRole("button", { name: "Add Data" });

  fireEvent.change(titleInput, {
    target: { value: "Test Task" },
  });

  fireEvent.change(statusInput, {
    target: { value: "Pending" },
  });

  await act(async () => {
    fireEvent.click(addButton);
    

   expect(global.fetch).toHaveBeenCalledWith(
  "/api/data",
  expect.objectContaining({
    method: "POST",
  })
);
  });
});